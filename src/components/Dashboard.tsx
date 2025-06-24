'use client';

import { useState } from 'react';
import {
  Container,
  Heading,
  VStack,
  HStack,
  Box,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
} from '@chakra-ui/react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

import { CategoryBreakdown, HierarchicalDashboardData, MonthlyData } from '@/lib/hierarchical-dashboard-utils';
import MonthlyCategoryChart from './MonthlyCategoryChart';
import Link from 'next/link';

export type DashboardData = HierarchicalDashboardData;

interface DashboardProps {
  data: HierarchicalDashboardData | null;
}

export default function Dashboard({ data }: DashboardProps) {
  const [showDetailedCategories, setShowDetailedCategories] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP') + '円';
  };

  // Filter data based on selected period
  const filterDataByPeriod = (monthlyData: MonthlyData[], detailedCategories: HierarchicalDashboardData['detailedCategoryBreakdown'], majorCategories: CategoryBreakdown[]) => {
    if (selectedPeriod === 'all') {
      return { monthlyData, detailedCategories, majorCategories };
    }

    const now = new Date();
    let cutoffDate: Date;

    switch (selectedPeriod) {
      case '1year':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case '6months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '3months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      default:
        return { monthlyData, detailedCategories, majorCategories };
    }

    const filteredMonthlyData = monthlyData.filter(item => {
      const itemDate = new Date(item.month + '-01');
      return itemDate >= cutoffDate;
    });

    // Recalculate category totals for filtered period
    const categoryTotals = new Map<string, { amount: number; count: number }>();
    const detailedCategoryTotals = new Map<string, { majorCategory: string; minorCategory: string | null; amount: number; count: number }>();

    filteredMonthlyData.forEach(monthData => {
      // Major categories
      monthData.monthlyCategories?.forEach((cat: CategoryBreakdown) => {
        const existing = categoryTotals.get(cat.name) || { amount: 0, count: 0 };
        categoryTotals.set(cat.name, {
          amount: existing.amount + cat.amount,
          count: existing.count + cat.count,
        });
      });

      // Detailed categories
      monthData.monthlyDetailedCategories?.forEach((cat) => {
        const key = `${cat.majorCategory}_${cat.minorCategory || 'null'}`;
        const existing = detailedCategoryTotals.get(key) || {
          majorCategory: cat.majorCategory,
          minorCategory: cat.minorCategory,
          amount: 0,
          count: 0,
        };
        detailedCategoryTotals.set(key, {
          ...existing,
          amount: existing.amount + cat.amount,
          count: existing.count + cat.count,
        });
      });
    });

    const filteredMajorCategories = Array.from(categoryTotals.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
    })).sort((a, b) => b.amount - a.amount);

    const filteredDetailedCategories = Array.from(detailedCategoryTotals.values())
      .sort((a, b) => b.amount - a.amount);

    return {
      monthlyData: filteredMonthlyData,
      detailedCategories: filteredDetailedCategories,
      majorCategories: filteredMajorCategories,
    };
  };

  const filteredData = data ? filterDataByPeriod(
    data.monthlyCategories,
    data.detailedCategoryBreakdown || [],
    data.majorCategoryBreakdown || data.categoryBreakdown
  ) : { monthlyData: [], detailedCategories: [], majorCategories: [] };

  if (!data) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8}>
          <Heading>クレジットカード利用明細ダッシュボード</Heading>
          <Text>データがありません。</Text>
          <Button as={Link} href="/transactions" colorScheme="blue">
            明細をインポート
          </Button>
        </VStack>
      </Container>
    );
  }

  // Choose which category breakdown to display
  const currentCategoryBreakdown = showDetailedCategories 
    ? filteredData.detailedCategories?.map(item => ({
        name: `${item.majorCategory}${item.minorCategory ? ` > ${item.minorCategory}` : ''}`,
        amount: item.amount,
        count: item.count,
      })) || []
    : filteredData.majorCategories;

  // Chart data
  const doughnutData = {
    labels: currentCategoryBreakdown.map(item => item.name),
    datasets: [
      {
        data: currentCategoryBreakdown.map(item => item.amount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6E40',
          '#8E24AA',
          '#00ACC1',
          '#7CB342',
          '#FFA726',
          '#EF5350',
          '#AB47BC',
          '#26A69A',
          '#C9CBCF',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Generate stacked bar chart data for monthly spending by category
  const generateStackedBarData = () => {
    const monthLabels = filteredData.monthlyData.map(item => item.month);
    const categoriesData = showDetailedCategories 
      ? filteredData.detailedCategories || []
      : filteredData.majorCategories;

    const categoryNames = categoriesData.map(cat => 
      showDetailedCategories && 'majorCategory' in cat
        ? `${cat.majorCategory}${cat.minorCategory ? ` > ${cat.minorCategory}` : ''}`
        : (cat as CategoryBreakdown).name
    );

    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(255, 110, 64, 0.8)',
      'rgba(142, 36, 170, 0.8)',
      'rgba(0, 172, 193, 0.8)',
      'rgba(124, 179, 66, 0.8)',
      'rgba(255, 167, 38, 0.8)',
      'rgba(239, 83, 80, 0.8)',
      'rgba(171, 71, 188, 0.8)',
      'rgba(38, 166, 154, 0.8)',
      'rgba(201, 203, 207, 0.8)',
    ];

    const datasets = categoryNames.map((categoryName, index) => {
      const categoryData = monthLabels.map(month => {
        const monthData = filteredData.monthlyData.find(m => m.month === month);
        if (!monthData) return 0;

        if (showDetailedCategories) {
          const detailedCategory = monthData.monthlyDetailedCategories?.find(cat => 
            `${cat.majorCategory}${cat.minorCategory ? ` > ${cat.minorCategory}` : ''}` === categoryName
          );
          return detailedCategory?.amount || 0;
        } else {
          const category = monthData.monthlyCategories.find(cat => cat.name === categoryName);
          return category?.amount || 0;
        }
      });

      return {
        label: categoryName,
        data: categoryData,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.8', '1'),
        borderWidth: 1,
      };
    });

    return {
      labels: monthLabels,
      datasets,
    };
  };

  const barData = generateStackedBarData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            return `${context.dataset.label}: ${formatAmount(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function(value: any) {
            return formatAmount(value);
          }
        }
      },
    },
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading flex="1" textAlign={{ base: "center", md: "left" }}>
            クレジットカード利用明細ダッシュボード
          </Heading>
          <Button 
            as={Link} 
            href="/transactions" 
            colorScheme="blue" 
            variant="outline"
            size="sm"
            flex="none"
            whiteSpace="nowrap"
          >
            明細管理へ
          </Button>
        </HStack>

        {/* Dashboard Controls */}
        <HStack 
          spacing={6} 
          justify={{ base: "center", md: "flex-start" }}
          wrap="wrap"
          gap={4}
          p={4}
          bg="gray.50"
          borderRadius="lg"
        >
          <FormControl display="flex" alignItems="center" flex="none">
            <FormLabel htmlFor="period-select" mb="0" fontSize="sm" mr={2} whiteSpace="nowrap">
              期間:
            </FormLabel>
            <Select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              size="sm"
              minW="120px"
              maxW="180px"
              bg="white"
            >
              <option value="all">全期間</option>
              <option value="1year">直近1年</option>
              <option value="6months">直近半年</option>
              <option value="3months">直近3ヶ月</option>
            </Select>
          </FormControl>
          <FormControl display="flex" alignItems="center" flex="none">
            <FormLabel htmlFor="category-toggle" mb="0" fontSize="sm" mr={2} whiteSpace="nowrap">
              詳細表示
            </FormLabel>
            <Switch
              id="category-toggle"
              isChecked={showDetailedCategories}
              onChange={(e) => setShowDetailedCategories(e.target.checked)}
              colorScheme="blue"
            />
          </FormControl>
        </HStack>

        {/* Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
          <GridItem>
            <Stat bg="white" p={6} borderRadius="lg" shadow="sm">
              <StatLabel>
                総利用金額
                {selectedPeriod !== 'all' && (
                  <Text fontSize="xs" color="gray.500">
                    ({selectedPeriod === '1year' ? '直近1年' : 
                      selectedPeriod === '6months' ? '直近半年' : '直近3ヶ月'})
                  </Text>
                )}
              </StatLabel>
              <StatNumber>
                {formatAmount(
                  currentCategoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0)
                )}
              </StatNumber>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat bg="white" p={6} borderRadius="lg" shadow="sm">
              <StatLabel>カテゴリ数</StatLabel>
              <StatNumber>
                {showDetailedCategories 
                  ? filteredData.detailedCategories?.length || 0
                  : filteredData.majorCategories?.length || 0
                }
              </StatNumber>
              <StatHelpText>
                {showDetailedCategories ? '詳細カテゴリ' : '大カテゴリ'}
              </StatHelpText>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat bg="white" p={6} borderRadius="lg" shadow="sm">
              <StatLabel>未分類取引</StatLabel>
              <StatNumber>{data.uncategorizedCount}</StatNumber>
              <StatHelpText>カテゴリ未設定の取引数</StatHelpText>
            </Stat>
          </GridItem>
        </Grid>

        {/* Charts */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Heading size="md" mb={4}>
                全期間カテゴリ別支出割合
                {showDetailedCategories && <Text fontSize="sm" color="gray.600">(詳細表示)</Text>}
              </Heading>
              {currentCategoryBreakdown.length > 0 ? (
                <Doughnut 
                  data={doughnutData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          label: function(context: any) {
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatAmount(context.parsed)} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  カテゴリ分けされた取引がありません
                </Text>
              )}
            </Box>
          </GridItem>

          <GridItem>
            <MonthlyCategoryChart 
              monthlyData={filteredData.monthlyData}
              availableMonths={filteredData.monthlyData.map(m => m.month)}
              showDetailedCategories={showDetailedCategories}
            />
          </GridItem>
        </Grid>

        {/* Monthly spending chart */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>
            月別カテゴリ別利用金額
            {showDetailedCategories && <Text fontSize="sm" color="gray.600">(詳細表示)</Text>}
          </Heading>
          {filteredData.monthlyData.length > 0 ? (
            <Bar data={barData} options={chartOptions} />
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              データがありません
            </Text>
          )}
        </Box>

        {/* Category breakdown table */}
        {currentCategoryBreakdown.length > 0 && (
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Heading size="md" mb={4}>
              カテゴリ別詳細
              {showDetailedCategories && <Text fontSize="sm" color="gray.600">(大カテゴリ &gt; 小カテゴリ)</Text>}
            </Heading>
            {showDetailedCategories ? (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>大カテゴリ</Th>
                      <Th>小カテゴリ</Th>
                      <Th isNumeric>金額</Th>
                      <Th isNumeric>件数</Th>
                      <Th isNumeric>割合</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredData.detailedCategories?.map((category, index) => {
                      const totalAmount = currentCategoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
                      const percentage = ((category.amount / totalAmount) * 100).toFixed(1);
                      return (
                        <Tr key={index}>
                          <Td fontWeight="semibold">{category.majorCategory}</Td>
                          <Td color={category.minorCategory ? "inherit" : "gray.500"}>
                            {category.minorCategory || "（小カテゴリなし）"}
                          </Td>
                          <Td isNumeric>{formatAmount(category.amount)}</Td>
                          <Td isNumeric>{category.count}</Td>
                          <Td isNumeric>{percentage}%</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <VStack spacing={2} align="stretch">
                {currentCategoryBreakdown.map((category, index) => {
                  const totalAmount = currentCategoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
                  const percentage = ((category.amount / totalAmount) * 100).toFixed(1);
                  return (
                    <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <Text fontWeight="semibold">{category.name}</Text>
                      <HStack>
                        <Text>{formatAmount(category.amount)}</Text>
                        <Text color="gray.500" fontSize="sm">({category.count}件, {percentage}%)</Text>
                      </HStack>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
}