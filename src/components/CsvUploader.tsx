'use client';

import { useState } from 'react';
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

interface CsvUploaderProps {
  onUploadSuccess?: (statementId: number) => void;
}

export function CsvUploader({ onUploadSuccess }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

    setIsUploading(true);
    
    try {
      const fileContent = await file.text();
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: fileContent,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'インポート成功',
          description: 'CSVファイルのインポートが完了しました。',
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
        throw new Error(result.error || 'インポートに失敗しました');
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
    } finally {
      setIsUploading(false);
    }
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
          </Text>
        </Alert>

        <Input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {file && (
          <Text fontSize="sm" color="gray.600">
            選択されたファイル: {file.name}
          </Text>
        )}

        {isUploading && (
          <Box>
            <Text fontSize="sm" mb={2}>
              アップロード中...
            </Text>
            <Progress size="sm" isIndeterminate />
          </Box>
        )}

        <Button
          colorScheme="blue"
          onClick={handleUpload}
          disabled={!file || isUploading}
          isLoading={isUploading}
          loadingText="アップロード中"
        >
          CSVをインポート
        </Button>
      </VStack>
    </Box>
  );
}