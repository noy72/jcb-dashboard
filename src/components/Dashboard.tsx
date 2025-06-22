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

import { HierarchicalDashboardData } from '@/lib/hierarchical-dashboard-utils';
import MonthlyCategoryChart from './MonthlyCategoryChart';
import Link from 'next/link';

interface DashboardProps {
  data: HierarchicalDashboardData | null;
}

export default function Dashboard({ data }: DashboardProps) {
  const [showDetailedCategories, setShowDetailedCategories] = useState(false);
  
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP') + '円';
  };

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
    ? data.detailedCategoryBreakdown?.map(item => ({
        name: `${item.majorCategory}${item.minorCategory ? ` > ${item.minorCategory}` : ''}`,
        amount: item.amount,
        count: item.count,
      })) || []
    : data.majorCategoryBreakdown || data.categoryBreakdown;

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

  const barData = {
    labels: data.monthlyData.map(item => item.month),
    datasets: [
      {
        label: '月別利用金額',
        data: data.monthlyData.map(item => item.amount),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>クレジットカード利用明細ダッシュボード</Heading>
          <HStack spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="category-toggle" mb="0" fontSize="sm">
                詳細表示
              </FormLabel>
              <Switch
                id="category-toggle"
                isChecked={showDetailedCategories}
                onChange={(e) => setShowDetailedCategories(e.target.checked)}
                colorScheme="blue"
              />
            </FormControl>
            <Button as={Link} href="/transactions" colorScheme="blue">
              明細管理へ
            </Button>
          </HStack>
        </HStack>

        {/* Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
          <GridItem>
            <Stat bg="white" p={6} borderRadius="lg" shadow="sm">
              <StatLabel>総利用金額</StatLabel>
              <StatNumber>{formatAmount(data.totalAmount)}</StatNumber>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat bg="white" p={6} borderRadius="lg" shadow="sm">
              <StatLabel>カテゴリ数</StatLabel>
              <StatNumber>
                {showDetailedCategories 
                  ? data.detailedCategoryBreakdown?.length || 0
                  : data.majorCategoryBreakdown?.length || data.categoryBreakdown.length
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
              monthlyData={data.monthlyCategories}
              availableMonths={data.availableMonths}
              showDetailedCategories={showDetailedCategories}
            />
          </GridItem>
        </Grid>

        {/* Monthly spending chart */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>月別利用金額</Heading>
          {data.monthlyData.length > 0 ? (
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
                    {data.detailedCategoryBreakdown?.map((category, index) => {
                      const percentage = ((category.amount / data.totalAmount) * 100).toFixed(1);
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
                  const percentage = ((category.amount / data.totalAmount) * 100).toFixed(1);
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