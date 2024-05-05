import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtendedUser } from '@/next-auth';

interface UserInfoProps {
  user?: ExtendedUser;
  label: string;
}

export const UserInfo = ({ user, label }: UserInfoProps) => (
  <Card className='w-[600px] shadow-md'>
    <CardHeader>
      <CardTitle className='text-2xl font-semibold text-center'>
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4'>
      {[
        { label: 'ID', value: user?.id },
        { label: 'Name', value: user?.name },
        { label: 'Email', value: user?.email },
        { label: 'Role', value: user?.role },
      ].map(({ label, value }) => (
        <div
          key={label}
          className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'
        >
          <p className='text-sm font-medium'>{label}</p>
          <p className='truncate text-xs max-w-[180px] font-mono p-1 bg-slate-100 rounded-md'>
            {value}
          </p>
        </div>
      ))}
      <div className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
        <p className='text-sm font-medium'>Two Factor Authentication</p>
        <Badge variant={user?.isTwoFactorEnabled ? 'success' : 'destructive'}>
          {user?.isTwoFactorEnabled ? 'ON' : 'OFF'}
        </Badge>
      </div>
    </CardContent>
  </Card>
);
