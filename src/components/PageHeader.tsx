// Page title band used on every page except home. The intro (if any) sits under the h1.
export default function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-tint">
      <div className="container-page py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">{title}</h1>
        {children && <div className="mt-4 max-w-3xl text-lg text-muted">{children}</div>}
      </div>
    </div>
  );
}
