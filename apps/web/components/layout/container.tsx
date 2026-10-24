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
    page: "max-w-[1320px] px-4 md:px-6 lg:px-10 xl:px-14",
    wide: "max-w-[1600px] px-4 md:px-6 lg:px-8",
    prose: "max-w-[720px] px-4 md:px-6",
  }[size];

  return (
    <div className={cx("mx-auto w-full", sizeClasses, className)} {...rest}>
      {children}
    </div>
  );
}
