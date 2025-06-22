'use client';

import { useState, useEffect } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import Dashboard, { DashboardData } from './Dashboard';

interface ClientOnlyDashboardProps {
  data: DashboardData | null;
}

export default function ClientOnlyDashboard({ data }: ClientOnlyDashboardProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return <Dashboard data={data} />;
}