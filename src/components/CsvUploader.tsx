'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  useToast,
  Progress,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { importCSV } from '@/lib/actions/import';

interface CsvUploaderProps {
  onUploadSuccess?: (statementId: number) => void;
}

export function CsvUploader({ onUploadSuccess }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: 'ファイル形式エラー',
        description: 'CSVファイルを選択してください。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'ファイル未選択',
        description: 'CSVファイルを選択してください。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    startTransition(async () => {
      try {
        // Read file as ArrayBuffer to handle SHIFT-JIS encoding
        const arrayBuffer = await file.arrayBuffer();
        
        // Try to decode as SHIFT-JIS first, fallback to UTF-8
        let fileContent: string;
        try {
          const decoder = new TextDecoder('shift_jis');
          fileContent = decoder.decode(arrayBuffer);
          
          // Check if the decoded content contains valid Japanese characters
          // If it contains replacement characters (�), it might indicate encoding issues
          if (fileContent.includes('�')) {
            throw new Error('Possible encoding mismatch detected');
          }
        } catch (error) {
          console.warn('Failed to decode as SHIFT-JIS, trying UTF-8:', error);
          try {
            const decoder = new TextDecoder('utf-8');
            fileContent = decoder.decode(arrayBuffer);
          } catch {
            throw new Error('ファイルのエンコーディングを読み取れませんでした。SHIFT-JISまたはUTF-8のCSVファイルを使用してください。');
          }
        }
        
        const result = await importCSV(fileContent);

        if (result.success) {
          toast({
            title: 'インポート成功',
            description: result.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          setFile(null);
          // Reset the input
          const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          
          if (onUploadSuccess && result.statementId) {
            onUploadSuccess(result.statementId);
          }
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'インポートエラー',
          description: error instanceof Error ? error.message : 'インポートに失敗しました。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold">
          JCB利用明細CSVインポート
        </Text>
        
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            JCBカードの利用明細CSVファイルを選択してアップロードしてください。
            SHIFT-JISおよびUTF-8エンコーディングに対応しています。
          </Text>
        </Alert>

        <Input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isPending}
        />

        {file && (
          <Text fontSize="sm" color="gray.600">
            選択されたファイル: {file.name}
          </Text>
        )}

        {isPending && (
          <Box>
            <Text fontSize="sm" mb={2}>
              インポート中...
            </Text>
            <Progress size="sm" isIndeterminate />
          </Box>
        )}

        <Button
          colorScheme="blue"
          onClick={handleUpload}
          disabled={!file || isPending}
          isLoading={isPending}
          loadingText="インポート中"
        >
          CSVをインポート
        </Button>
      </VStack>
    </Box>
  );
}