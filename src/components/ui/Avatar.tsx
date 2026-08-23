import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  /** Rendered when there's no photo. Defaults to true — set false to always
   * prefer fallbackIcon over initials (e.g. a brand mark that shouldn't
   * change to a user's initials just because no photo is set yet). */
  showInitials?: boolean;
  /** Rendered instead of initials when there's no photo and no name to derive initials from. */
  fallbackIcon?: React.ReactNode;
}

function getInitials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  name,
  size = 32,
  className,
  showInitials = true,
  fallbackIcon,
}: AvatarProps) {
  const initials = showInitials ? getInitials(name) : '';
  const style = { width: size, height: size };

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar is a
    // user-uploaded base64 data URI, not a static/remote asset next/image
    // needs to optimize.
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        style={style}
        className={cn('rounded-full object-cover shrink-0', className)}
      />
    );
  }

  return (
    <span
      style={style}
      className={cn(
        'flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 font-semibold',
        className
      )}
    >
      {initials ? (
        <span style={{ fontSize: Math.max(10, size * 0.4) }}>{initials}</span>
      ) : (
        fallbackIcon
      )}
    </span>
  );
}