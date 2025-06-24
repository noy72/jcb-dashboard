'use client';

import { useState, useTransition } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Input,
  Select,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
} from '@chakra-ui/react';
import { createMajorCategory, createMinorCategory } from '@/lib/actions/hierarchical-categories';

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

interface HierarchicalCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
  majorCategories: MajorCategory[];
}

export function HierarchicalCategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
  majorCategories,
}: HierarchicalCategoryModalProps) {
  const [majorCategoryName, setMajorCategoryName] = useState('');
  const [minorCategoryName, setMinorCategoryName] = useState('');
  const [selectedMajorCategoryId, setSelectedMajorCategoryId] = useState('');
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleCreateMajorCategory = async () => {
    if (!majorCategoryName.trim()) {
      toast({
        title: '入力エラー',
        description: '大カテゴリ名を入力してください。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    startTransition(async () => {
      try {
        await createMajorCategory(majorCategoryName.trim());
        toast({
          title: '作成成功',
          description: '大カテゴリが作成されました。',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setMajorCategoryName('');
        onCategoryCreated();
      } catch (error) {
        console.error('Error creating major category:', error);
        toast({
          title: '作成エラー',
          description: '大カテゴリの作成に失敗しました。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  const handleCreateMinorCategory = async () => {
    if (!minorCategoryName.trim()) {
      toast({
        title: '入力エラー',
        description: '小カテゴリ名を入力してください。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedMajorCategoryId) {
      toast({
        title: '選択エラー',
        description: '大カテゴリを選択してください。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    startTransition(async () => {
      try {
        await createMinorCategory(parseInt(selectedMajorCategoryId), minorCategoryName.trim());
        toast({
          title: '作成成功',
          description: '小カテゴリが作成されました。',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setMinorCategoryName('');
        setSelectedMajorCategoryId('');
        onCategoryCreated();
      } catch (error) {
        console.error('Error creating minor category:', error);
        toast({
          title: '作成エラー',
          description: '小カテゴリの作成に失敗しました。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  const handleClose = () => {
    setMajorCategoryName('');
    setMinorCategoryName('');
    setSelectedMajorCategoryId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>階層カテゴリ管理</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs>
            <TabList>
              <Tab>大カテゴリ作成</Tab>
              <Tab>小カテゴリ作成</Tab>
              <Tab>既存カテゴリ一覧</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text>新しい大カテゴリを作成</Text>
                  <Input
                    placeholder="大カテゴリ名を入力"
                    value={majorCategoryName}
                    onChange={(e) => setMajorCategoryName(e.target.value)}
                    disabled={isPending}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleCreateMajorCategory}
                    disabled={isPending || !majorCategoryName.trim()}
                    isLoading={isPending}
                  >
                    大カテゴリを作成
                  </Button>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text>新しい小カテゴリを作成</Text>
                  <Select
                    placeholder="大カテゴリを選択"
                    value={selectedMajorCategoryId}
                    onChange={(e) => setSelectedMajorCategoryId(e.target.value)}
                    disabled={isPending}
                  >
                    {majorCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="小カテゴリ名を入力"
                    value={minorCategoryName}
                    onChange={(e) => setMinorCategoryName(e.target.value)}
                    disabled={isPending}
                  />
                  <Button
                    colorScheme="green"
                    onClick={handleCreateMinorCategory}
                    disabled={isPending || !minorCategoryName.trim() || !selectedMajorCategoryId}
                    isLoading={isPending}
                  >
                    小カテゴリを作成
                  </Button>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="semibold">既存の階層カテゴリ</Text>
                  {majorCategories.length === 0 ? (
                    <Text color="gray.500">カテゴリがありません</Text>
                  ) : (
                    majorCategories.map((majorCategory) => (
                      <Box key={majorCategory.id} p={3} borderWidth="1px" borderRadius="md">
                        <Text fontWeight="semibold" color="blue.600">
                          {majorCategory.name}
                        </Text>
                        {majorCategory.minor_categories.length > 0 ? (
                          <VStack align="start" mt={2} spacing={1}>
                            {majorCategory.minor_categories.map((minorCategory) => (
                              <Text key={minorCategory.id} ml={4} fontSize="sm" color="gray.600">
                                • {minorCategory.name}
                              </Text>
                            ))}
                          </VStack>
                        ) : (
                          <Text ml={4} fontSize="sm" color="gray.400" mt={1}>
                            小カテゴリなし
                          </Text>
                        )}
                      </Box>
                    ))
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleClose}>閉じる</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}