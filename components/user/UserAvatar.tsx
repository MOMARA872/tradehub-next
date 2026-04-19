import { memo } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type MinimalUser = Pick<import('@/lib/types').User, 'id' | 'displayName' | 'avatarInitials'> & {
  profileImage?: string | null;
};

const sizeMap = {
  sm: { classes: 'h-8 w-8 min-h-8 min-w-8 text-xs', px: 32 },
  md: { classes: 'h-10 w-10 min-h-10 min-w-10 text-sm', px: 40 },
  lg: { classes: 'h-20 w-20 min-h-20 min-w-20 text-2xl', px: 80 },
};

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '';

function isAllowedImageUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === SUPABASE_HOST
      || hostname === 'images.unsplash.com'
      || hostname === 'plus.unsplash.com'
      || hostname === 'placehold.co';
  } catch {
    return false;
  }
}

function UserAvatar({ user, size = 'md' }: { user: MinimalUser | null; size?: 'sm' | 'md' | 'lg' }) {
  const { classes, px } = sizeMap[size];

  const safeImage = user?.profileImage && isAllowedImageUrl(user.profileImage)
    ? user.profileImage
    : null;

  if (safeImage) {
    return (
      <div className={cn('rounded-full overflow-hidden shrink-0', classes)}>
        <Image
          src={safeImage}
          alt={user!.displayName}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          title={user!.displayName}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand text-white flex items-center justify-center font-semibold shrink-0',
        classes
      )}
      title={user?.displayName || 'Unknown'}
    >
      {user?.avatarInitials || '?'}
    </div>
  );
}

const UserAvatarMemo = memo(UserAvatar);
export { UserAvatarMemo as UserAvatar };
export default UserAvatarMemo;
