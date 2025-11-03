import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useHapticFeedback } from '../../utils/haptics';
import {
  HomeIcon,
  ShoppingBagIcon,
  PlusCircleIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

export function MobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation('common');
  const { navigation } = useHapticFeedback();

  if (!isAuthenticated || !user) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const buyerNavItems = [
    {
      id: 'home',
      label: t('navigation.home'),
      path: '/buyer',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      id: 'products',
      label: t('navigation.products'),
      path: '/buyer',
      icon: ShoppingBagIcon,
      iconSolid: ShoppingBagIconSolid,
    },
    {
      id: 'wishlist',
      label: t('navigation.wishlist'),
      path: '/buyer/wishlist',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
    },
    {
      id: 'profile',
      label: t('navigation.profile'),
      path: '/buyer/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
  ];

  const sellerNavItems = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      path: '/seller',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      id: 'products',
      label: t('navigation.products'),
      path: '/seller/products',
      icon: ShoppingBagIcon,
      iconSolid: ShoppingBagIconSolid,
    },
    {
      id: 'add',
      label: t('navigation.add'),
      path: '/seller/add',
      icon: PlusCircleIcon,
      iconSolid: PlusCircleIconSolid,
    },
    {
      id: 'orders',
      label: t('navigation.orders'),
      path: '/seller/orders',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
    },
  ];

  const navItems = user.type === 'buyer' ? buyerNavItems : sellerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.iconSolid : item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                navigation();
                navigate(item.path);
              }}
              className={`
                flex flex-col items-center justify-center p-2 min-w-0 flex-1
                touch-manipulation transition-colors duration-200
                ${active 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700 active:text-indigo-600'
                }
              `}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}