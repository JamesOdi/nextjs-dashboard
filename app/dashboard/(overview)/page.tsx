import { Suspense } from 'react';
import { fetchCardData, fetchLatestInvoices } from '../../lib/data';
import CardWrapper, { Card } from '../../ui/dashboard/cards';
import LatestInvoices from '../../ui/dashboard/latest-invoices';
import RevenueChart from '../../ui/dashboard/revenue-chart';
import { lusitana } from '../../ui/fonts';
import {
  CardsSkeleton,
  LatestInvoicesSkeleton,
  RevenueChartSkeleton,
} from '@/app/ui/skeletons';
// File is inside (overview) folder because we do not want the loading to be applied to other pages
// when using (), the name inside the parenthesis will not be included in the url path
export default async function Page() {
  const {
    numberOfCustomers,
    numberOfInvoices,
    totalPaidInvoices,
    totalPendingInvoices,
  } = await fetchCardData();
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices />
        </Suspense>
      </div>
    </main>
  );
}
