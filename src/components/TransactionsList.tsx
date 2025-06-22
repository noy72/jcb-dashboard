'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  VStack,
  Text,
  useToast,
  HStack,
  Select,
  useDisclosure,
} from '@chakra-ui/react';
import { CsvUploader } from '@/components/CsvUploader';
import { CategoryModal } from '@/components/CategoryModal';
import { updateStoreCategoryMapping } from '@/lib/actions/store-categories';
import { useRouter } from 'next/navigation';

export interface Transaction {
  id: number;
  transaction_date: Date;
  store_name: string;
  amount: number;
  payment_type: string;
  note: string | null;
  category: {
    id: number;
    name: string;
  } | null;
  storeCategory: {
    id: number;
    name: string;
  } | null;
  statement: {
    id: number;
    payment_date: Date;
    total_amount: number;
  };
}

export interface Category {
  id: number;
  name: string;
}

interface TransactionsListProps {
  initialTransactions: Transaction[];
  categories: Category[];
  availableMonths: string[];
  initialMonthFilter?: string;
}

export default function TransactionsList({ 
  initialTransactions, 
  categories, 
  availableMonths,
  initialMonthFilter = '' 
}: TransactionsListProps) {
  const [isPending, startTransition] = useTransition();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  const handleUpdateStoreCategory = async (storeName: string, categoryId: number) => {
    startTransition(async () => {
      try {
        await updateStoreCategoryMapping(storeName, categoryId);
        toast({
          title: 'カテゴリ更新成功',
          description: '店舗カテゴリが更新されました。',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Error updating store category:', error);
        toast({
          title: 'カテゴリ更新エラー',
          description: '店舗カテゴリの更新に失敗しました。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  const handleUploadSuccess = () => {
    router.refresh();
  };

  const handleCategoryCreated = () => {
    router.refresh();
  };

  const handleMonthFilterChange = (value: string) => {
    const params = new URLSearchParams();
    if (value) {
      params.set('month', value);
    }
    router.push(`/transactions${params.toString() ? '?' + params.toString() : ''}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP') + '円';
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return `${year}年${month}月`;
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">利用明細管理</Heading>
        
        <CsvUploader onUploadSuccess={handleUploadSuccess} />
        
        <Box>
          <HStack spacing={4} mb={4} justify="space-between">
            <HStack spacing={4}>
              <Text fontWeight="semibold">フィルター:</Text>
              <Select
                placeholder="利用月で絞り込み"
                value={initialMonthFilter}
                onChange={(e) => handleMonthFilterChange(e.target.value)}
                maxW="200px"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </Select>
            </HStack>
            <Button colorScheme="green" onClick={onOpen}>
              新しいカテゴリを作成
            </Button>
          </HStack>
          
          {initialTransactions.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">
                取引データがありません。CSVファイルをインポートしてください。
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>利用日</Th>
                    <Th>店名</Th>
                    <Th isNumeric>金額</Th>
                    <Th>支払区分</Th>
                    <Th>カテゴリ</Th>
                    <Th>摘要</Th>
                    <Th>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {initialTransactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>{formatDate(transaction.transaction_date)}</Td>
                      <Td>{transaction.store_name}</Td>
                      <Td isNumeric>{formatAmount(transaction.amount)}</Td>
                      <Td>{transaction.payment_type}</Td>
                      <Td>
                        {transaction.storeCategory ? (
                          <Badge colorScheme="blue">{transaction.storeCategory.name}</Badge>
                        ) : (
                          <Badge colorScheme="gray">未分類</Badge>
                        )}
                      </Td>
                      <Td>{transaction.note || '-'}</Td>
                      <Td>
                        <Select
                          placeholder="カテゴリを選択"
                          size="sm"
                          value={transaction.storeCategory?.id || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateStoreCategory(transaction.store_name, parseInt(e.target.value));
                            }
                          }}
                          disabled={isPending}
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Select>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        <CategoryModal 
          isOpen={isOpen} 
          onClose={onClose} 
          onCategoryCreated={handleCategoryCreated}
        />
      </VStack>
    </Container>
  );
}