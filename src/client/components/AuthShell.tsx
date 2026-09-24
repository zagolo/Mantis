import type { ReactNode } from "react";
import { PRODUCT_NAME } from "../copy";

export function AuthShell({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <p className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="flex size-6 items-center justify-center">
            <img src="/icon-192.png" alt="" width={20} height={20} className="size-5" />
          </span>
          {PRODUCT_NAME}
        </p>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-[32em] text-sm leading-relaxed text-muted">{description}</p>
        {children}
        {footer ? <p className="mt-8 text-sm text-muted">{footer}</p> : null}
      </main>
    </div>
  );
}
