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

function UserAvatar({ user, size = 'md' }: { user: MinimalUser | null; size?: 'sm' | 'md' | 'lg' }) {
  const { classes, px } = sizeMap[size];

  if (user?.profileImage) {
    return (
      <div className={cn('rounded-full overflow-hidden shrink-0', classes)}>
        <Image
          src={user.profileImage}
          alt={user.displayName}
          width={px}
          height={px}
          unoptimized
          className="h-full w-full object-cover"
          title={user.displayName}
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
