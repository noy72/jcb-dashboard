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
  Input,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { createCategory } from '@/lib/actions/categories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
}

export function CategoryModal({ isOpen, onClose, onCategoryCreated }: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      toast({
        title: '入力エラー',
        description: 'カテゴリ名を入力してください。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    startTransition(async () => {
      try {
        await createCategory(categoryName.trim());
        toast({
          title: 'カテゴリ作成成功',
          description: `カテゴリ「${categoryName}」を作成しました。`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setCategoryName('');
        onCategoryCreated();
        onClose();
      } catch (error) {
        console.error('Error creating category:', error);
        toast({
          title: 'カテゴリ作成エラー',
          description: 'カテゴリの作成に失敗しました。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>新しいカテゴリを作成</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.600">
              取引を分類するためのカテゴリを作成してください。
            </Text>
            <Input
              placeholder="カテゴリ名を入力（例：食費、交通費、娯楽費）"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isPending}
            loadingText="作成中"
          >
            作成
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}