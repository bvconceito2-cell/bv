import React, { useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Checkout } from '../components/Checkout';
import { useStore } from '../store/useStore';

const CheckoutPage = () => {
  const { fetchFromSupabase } = useStore() as any;

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <Checkout />
      </div>
    </Layout>
  );
};

export default CheckoutPage;
