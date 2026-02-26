import type { ReactNode } from 'react';
import SideBar from './SideBar';
import TopBar from './TopBar';

type MainSkeletonProps = {
  children: ReactNode;
};

export default function MainSkeleton({ children }: MainSkeletonProps) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <SideBar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
