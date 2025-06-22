'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Select,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { Doughnut } from 'react-chartjs-2';
import { MonthlyData } from '@/lib/dashboard-utils';

interface MonthlyCategoryChartProps {
  monthlyData: MonthlyData[];
  availableMonths: string[];
}

export default function MonthlyCategoryChart({ 
  monthlyData, 
  availableMonths 
}: MonthlyCategoryChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Set initial month after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP') + '円';
  };

  const currentMonthData = monthlyData.find(data => data.month === selectedMonth);

  if (!currentMonthData || currentMonthData.monthlyCategories.length === 0) {
    return (
      <Box bg="white" p={6} borderRadius="lg" shadow="sm">
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="md">月別カテゴリ別支出割合</Heading>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              maxW="200px"
              size="sm"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </Select>
          </HStack>
          <Text color="gray.500" textAlign="center" py={8}>
            {selectedMonth ? '選択された月にカテゴリ分けされた取引がありません' : 'データがありません'}
          </Text>
        </VStack>
      </Box>
    );
  }

  const chartData = {
    labels: currentMonthData.monthlyCategories.map(item => item.name),
    datasets: [
      {
        data: currentMonthData.monthlyCategories.map(item => item.amount),
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const value = tooltipItem.raw as number;
            const total = currentMonthData.monthlyTotal;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${tooltipItem.label}: ${formatAmount(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="md">月別カテゴリ別支出割合</Heading>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            maxW="200px"
            size="sm"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </Select>
        </HStack>
        
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {formatMonth(selectedMonth)} 総支出: {formatAmount(currentMonthData.monthlyTotal)}
        </Text>

        <Box height="300px" display="flex" justifyContent="center" alignItems="center">
          <Doughnut data={chartData} options={chartOptions} />
        </Box>

        {/* Category details */}
        <VStack spacing={2} align="stretch" mt={4}>
          <Heading size="sm">カテゴリ詳細</Heading>
          {currentMonthData.monthlyCategories.map((category, index) => {
            const percentage = ((category.amount / currentMonthData.monthlyTotal) * 100).toFixed(1);
            return (
              <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                <Text fontWeight="semibold">{category.name}</Text>
                <HStack>
                  <Text>{formatAmount(category.amount)}</Text>
                  <Text color="gray.500" fontSize="sm">({percentage}%)</Text>
                  <Text color="gray.500" fontSize="sm">({category.count}件)</Text>
                </HStack>
              </HStack>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
}