import { cx } from "@/lib/format";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "page" | "wide" | "prose";
}

export function Container({
  children,
  size = "page",
  className,
  ...rest
}: ContainerProps) {
  const sizeClasses = {
    page: "max-w-7xl px-4 sm:px-6 lg:px-10",
    wide: "max-w-7xl px-4 sm:px-6 lg:px-10",
    prose: "max-w-3xl px-4 sm:px-6",
  }[size];

  return (
    <div className={cx("mx-auto w-full", sizeClasses, className)} {...rest}>
      {children}
    </div>
  );
}
