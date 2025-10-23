import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 50,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      src="/images/Marketing/OpticSave.png"
      alt="OpticSave Logo"
      width={width}
      height={width / 3}
      className={cn("w-auto h-auto", className)}
      priority
    />
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'} prefetch={true}>
      <LogoImage className={className} />
    </Link>
  );
}
