import type { ReactNode } from "react";

const base =
  "mt-1 w-full rounded-md bg-card border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label-caps">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-20 ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md bg-ink text-ivory py-2 px-3 text-sm font-medium ring-1 ring-black/5 transition-transform active:scale-[0.98] disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-card py-2 px-3 text-sm font-medium ${props.className ?? ""}`}
    />
  );
}

export function Panel({ children, title }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg ring-1 ring-black/5 bg-card p-4">
      {title ? <h2 className="font-display text-lg font-bold mb-3">{title}</h2> : null}
      {children}
    </div>
  );
}
