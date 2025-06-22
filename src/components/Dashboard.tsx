'use client';

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
import Link from 'next/link';

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

export interface DashboardData {
  totalAmount: number;
  categoryBreakdown: { name: string; amount: number; count: number }[];
  monthlyData: { month: string; amount: number }[];
  uncategorizedCount: number;
}

interface DashboardProps {
  data: DashboardData | null;
}

export default function Dashboard({ data }: DashboardProps) {
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

  // Chart data
  const doughnutData = {
    labels: data.categoryBreakdown.map(item => item.name),
    datasets: [
      {
        data: data.categoryBreakdown.map(item => item.amount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
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
          <Button as={Link} href="/transactions" colorScheme="blue">
            明細管理へ
          </Button>
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
              <StatNumber>{data.categoryBreakdown.length}</StatNumber>
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
              <Heading size="md" mb={4}>カテゴリ別支出割合</Heading>
              {data.categoryBreakdown.length > 0 ? (
                <Doughnut data={doughnutData} options={chartOptions} />
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  カテゴリ分けされた取引がありません
                </Text>
              )}
            </Box>
          </GridItem>
          
          <GridItem>
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
          </GridItem>
        </Grid>

        {/* Category breakdown table */}
        {data.categoryBreakdown.length > 0 && (
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Heading size="md" mb={4}>カテゴリ別詳細</Heading>
            <VStack spacing={2} align="stretch">
              {data.categoryBreakdown.map((category, index) => (
                <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="semibold">{category.name}</Text>
                  <HStack>
                    <Text>{formatAmount(category.amount)}</Text>
                    <Text color="gray.500" fontSize="sm">({category.count}件)</Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
}