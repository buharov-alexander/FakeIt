'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SearchParamsWrapper({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsContent>{children}</SearchParamsContent>
    </Suspense>
  );
}

function SearchParamsContent({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}

export default function useSearchParamsSafely() {
  return function Wrapper({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
    return <SearchParamsWrapper>{children}</SearchParamsWrapper>;
  };
}
