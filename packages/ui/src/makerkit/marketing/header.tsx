import { cn } from '../../lib/utils';

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = function ({
  className,
  logo,
  navigation,
  actions,
  ...props
}) {
  return (
    <div
      className={cn(
        'site-header bg-background dark:bg-background sticky top-0 z-50 w-full py-1 shadow-sm backdrop-blur-lg dark:[&_svg]:text-white',
        className,
      )}
      {...props}
    >
      <div className="container">
        <div className="grid h-14 grid-cols-3 items-center">
          <div className={'mx-auto lg:mx-0'}>{logo}</div>
          <div className="order-first lg:order-none">{navigation}</div>
          <div className="flex items-center justify-end gap-x-2">{actions}</div>
        </div>
      </div>
    </div>
  );
};
