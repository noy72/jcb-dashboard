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
  Flex,
} from '@chakra-ui/react';
import { CsvUploader } from '@/components/CsvUploader';
import { HierarchicalCategoryModal } from '@/components/HierarchicalCategoryModal';
import { 
  updateStoreHierarchicalCategoryMapping,
  getMinorCategoriesByMajor,
} from '@/lib/actions/hierarchical-categories';
import { useRouter } from 'next/navigation';

interface MajorCategory {
  id: number;
  name: string;
  minor_categories: MinorCategory[];
}

interface MinorCategory {
  id: number;
  name: string;
  major_category_id: number;
}

interface HierarchicalCategory {
  majorCategory: MajorCategory;
  minorCategory: MinorCategory | null;
}

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
  hierarchicalCategory: HierarchicalCategory | null;
  statement: {
    id: number;
    payment_date: Date;
    total_amount: number;
  };
}

interface HierarchicalTransactionsListProps {
  initialTransactions: Transaction[];
  majorCategories: MajorCategory[];
  availableMonths: string[];
  initialMonthFilter?: string;
}

export default function HierarchicalTransactionsList({ 
  initialTransactions, 
  majorCategories,
  availableMonths,
  initialMonthFilter = '' 
}: HierarchicalTransactionsListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedMajorCategory, setSelectedMajorCategory] = useState<{ [storeName: string]: string }>({});
  const [minorCategoriesByStore, setMinorCategoriesByStore] = useState<{ [storeName: string]: MinorCategory[] }>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  const handleMajorCategoryChange = async (storeName: string, majorCategoryId: string) => {
    setSelectedMajorCategory(prev => ({ ...prev, [storeName]: majorCategoryId }));
    
    if (majorCategoryId) {
      try {
        const minorCategories = await getMinorCategoriesByMajor(parseInt(majorCategoryId));
        setMinorCategoriesByStore(prev => ({ ...prev, [storeName]: minorCategories }));
      } catch (error) {
        console.error('Error fetching minor categories:', error);
      }
    } else {
      setMinorCategoriesByStore(prev => ({ ...prev, [storeName]: [] }));
    }
  };

  const handleUpdateHierarchicalCategory = async (
    storeName: string, 
    majorCategoryId: number, 
    minorCategoryId?: number
  ) => {
    startTransition(async () => {
      try {
        await updateStoreHierarchicalCategoryMapping(storeName, majorCategoryId, minorCategoryId);
        toast({
          title: 'カテゴリ更新成功',
          description: '店舗階層カテゴリが更新されました。',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Error updating hierarchical category:', error);
        toast({
          title: 'カテゴリ更新エラー',
          description: '店舗階層カテゴリの更新に失敗しました。',
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

  const renderCategoryBadge = (transaction: Transaction) => {
    if (transaction.hierarchicalCategory) {
      const { majorCategory, minorCategory } = transaction.hierarchicalCategory;
      return (
        <VStack spacing={1} align="start">
          <Badge colorScheme="blue" size="sm">{majorCategory.name}</Badge>
          {minorCategory && (
            <Badge colorScheme="green" size="sm">{minorCategory.name}</Badge>
          )}
        </VStack>
      );
    }
    return <Badge colorScheme="gray">未分類</Badge>;
  };

  const renderCategorySelectors = (transaction: Transaction) => {
    const storeName = transaction.store_name;
    const currentMajorCategoryId = transaction.hierarchicalCategory?.majorCategory.id || 
                                    selectedMajorCategory[storeName] || '';
    const currentMinorCategoryId = transaction.hierarchicalCategory?.minorCategory?.id || '';
    const availableMinorCategories = minorCategoriesByStore[storeName] || 
                                    transaction.hierarchicalCategory?.majorCategory.minor_categories || [];

    return (
      <VStack spacing={2} align="stretch">
        <Select
          placeholder="大カテゴリを選択"
          size="sm"
          value={currentMajorCategoryId}
          onChange={(e) => handleMajorCategoryChange(storeName, e.target.value)}
          disabled={isPending}
        >
          {majorCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        
        {currentMajorCategoryId && (
          <Select
            placeholder="小カテゴリを選択（任意）"
            size="sm"
            value={currentMinorCategoryId}
            onChange={(e) => {
              const minorCategoryId = e.target.value ? parseInt(e.target.value) : undefined;
              handleUpdateHierarchicalCategory(
                storeName, 
                parseInt(currentMajorCategoryId), 
                minorCategoryId
              );
            }}
            disabled={isPending}
          >
            {availableMinorCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
        
        {currentMajorCategoryId && (
          <Button
            size="xs"
            colorScheme="blue"
            onClick={() => handleUpdateHierarchicalCategory(storeName, parseInt(currentMajorCategoryId))}
            disabled={isPending}
          >
            大カテゴリのみで保存
          </Button>
        )}
      </VStack>
    );
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">利用明細管理（階層カテゴリ）</Heading>
        
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
              階層カテゴリを管理
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
                    <Th>階層カテゴリ</Th>
                    <Th>摘要</Th>
                    <Th>カテゴリ設定</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {initialTransactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>{formatDate(transaction.transaction_date)}</Td>
                      <Td>{transaction.store_name}</Td>
                      <Td isNumeric>{formatAmount(transaction.amount)}</Td>
                      <Td>{transaction.payment_type}</Td>
                      <Td>{renderCategoryBadge(transaction)}</Td>
                      <Td>{transaction.note || '-'}</Td>
                      <Td>{renderCategorySelectors(transaction)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        <HierarchicalCategoryModal 
          isOpen={isOpen} 
          onClose={onClose} 
          onCategoryCreated={handleCategoryCreated}
          majorCategories={majorCategories}
        />
      </VStack>
    </Container>
  );
}