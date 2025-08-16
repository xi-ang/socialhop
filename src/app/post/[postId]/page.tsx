import ClientPostDetail from './ClientPostDetail';

export default function PostDetailPage({
  params,
  searchParams,
}: {
  params: { postId: string };
  searchParams: { tab?: string };
}) {
  return (
    <ClientPostDetail 
      postId={params.postId}
      defaultTab={searchParams.tab || 'comments'}
    />
  );
}
