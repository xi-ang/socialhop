async function TasksPage() {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  const response = await fetch(`${origin}/api/tasks`, {
    cache: "no-store",
  });
  const tasks = await response.json();

  console.log("tasks:", tasks);

  return <div>TasksPage</div>;
}
export default TasksPage;
