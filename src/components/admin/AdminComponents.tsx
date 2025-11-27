'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Users, BookOpen, ClipboardList, Trophy, 
  GraduationCap, Building2, Settings, Database,
  TrendingUp, Clock, CheckCircle, XCircle,
  FileText, Folder, BarChart3, Calendar,
  Mail, Shield, Star, Target, Eye, Edit,
  Trash2, Plus, Download, Upload, Search,
  Filter, ChevronRight, ArrowLeft, RefreshCw,
  AlertTriangle, Info, HelpCircle, Bell,
  Activity, Zap, Award, Hash, UserPlus,
  BookMarked, MessageSquare, LucideIcon
} from 'lucide-react'

// Icon mapping for consistent usage across admin pages
export const AdminIcons = {
  // Navigation & Pages
  users: Users,
  courses: BookOpen,
  tasks: ClipboardList,
  rankings: Trophy,
  students: GraduationCap,
  classes: Building2,
  settings: Settings,
  database: Database,
  materials: BookMarked,
  chat: MessageSquare,
  
  // Stats & Metrics
  trending: TrendingUp,
  pending: Clock,
  completed: CheckCircle,
  failed: XCircle,
  activity: Activity,
  performance: Zap,
  awards: Award,
  target: Target,
  
  // Content
  file: FileText,
  folder: Folder,
  chart: BarChart3,
  calendar: Calendar,
  email: Mail,
  
  // Status
  shield: Shield,
  star: Star,
  warning: AlertTriangle,
  info: Info,
  help: HelpCircle,
  notification: Bell,
  
  // Actions
  view: Eye,
  edit: Edit,
  delete: Trash2,
  add: Plus,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,
  next: ChevronRight,
  back: ArrowLeft,
  refresh: RefreshCw,
  userAdd: UserPlus,
  hash: Hash,
}

// Admin badge component - shows admin status
export function AdminBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ${className}`}>
      <Shield className="w-3 h-3" />
      ADMIN
    </span>
  )
}

// Unified Admin Page Header
interface AdminPageHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  showAdminBadge?: boolean
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'bg-gradient-to-br from-samsung-blue to-samsung-cyan',
  actions,
  breadcrumbs,
  showAdminBadge = true,
}: AdminPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="admin-header glass-card p-6 rounded-2xl border-l-4 border-l-amber-500"
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/admin" className="hover:text-samsung-blue transition-colors">
            Admin
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-samsung-blue transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Icon Container */}
          <div className={`w-16 h-16 rounded-2xl ${iconColor} flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl samsung-heading text-gray-900">{title}</h1>
              {showAdminBadge && <AdminBadge />}
            </div>
            <p className="samsung-body text-gray-600 max-w-xl">{description}</p>
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Unified Admin Stat Card
interface AdminStatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  onClick?: () => void
  href?: string
  delay?: number
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'bg-samsung-blue',
  trend,
  onClick,
  href,
  delay = 0,
}: AdminStatCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)' }}
      className={`admin-stat-card glass-card p-6 rounded-2xl transition-all duration-300 ${
        onClick || href ? 'cursor-pointer hover:border-samsung-blue/30' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm samsung-body text-gray-500 mb-1">{title}</p>
          <p className="text-3xl samsung-heading text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm samsung-body text-gray-600">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 ${!trend.positive ? 'rotate-180' : ''}`} />
              <span className="font-medium">{trend.value}%</span>
              <span className="text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 ${iconColor} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// Admin Action Button
interface AdminActionButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function AdminActionButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
}: AdminActionButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-samsung-blue to-samsung-cyan text-white hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 samsung-body font-medium transition-all duration-300 ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </motion.button>
  )
}

// Admin Quick Action Card - for dashboard quick links
interface AdminQuickActionProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  href: string
  badge?: string | number
  delay?: number
}

export function AdminQuickAction({
  title,
  description,
  icon: Icon,
  iconColor = 'bg-samsung-blue',
  href,
  badge,
  delay = 0,
}: AdminQuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
          whileTap={{ scale: 0.98 }}
          className="glass-card p-6 rounded-2xl cursor-pointer group transition-all duration-300 hover:border-samsung-blue/30 relative overflow-hidden"
        >
          {/* Background Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-samsung-blue/5 to-samsung-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              {badge !== undefined && (
                <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <h3 className="text-lg samsung-heading text-gray-900 mb-1 group-hover:text-samsung-blue transition-colors">
              {title}
            </h3>
            <p className="text-sm samsung-body text-gray-600">{description}</p>
            
            <div className="flex items-center gap-1 mt-3 text-samsung-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-sm font-medium">Go to {title}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

// Admin Empty State
interface AdminEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 flex items-center justify-center">
        <Icon className="w-10 h-10 text-samsung-blue" />
      </div>
      <h3 className="text-xl samsung-heading text-gray-900 mb-2">{title}</h3>
      <p className="samsung-body text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <AdminActionButton
          variant="primary"
          icon={action.icon || Plus}
          onClick={action.onClick}
        >
          {action.label}
        </AdminActionButton>
      )}
    </motion.div>
  )
}

// Admin Table Header
interface AdminTableHeaderProps {
  columns: {
    key: string
    label: string
    sortable?: boolean
    className?: string
  }[]
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
}

export function AdminTableHeader({
  columns,
  sortColumn,
  sortDirection,
  onSort,
}: AdminTableHeaderProps) {
  return (
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            onClick={() => col.sortable && onSort?.(col.key)}
            className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
              col.sortable ? 'cursor-pointer hover:text-samsung-blue transition-colors' : ''
            } ${col.className || ''}`}
          >
            <div className="flex items-center gap-2">
              {col.label}
              {col.sortable && sortColumn === col.key && (
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  sortDirection === 'asc' ? '-rotate-90' : 'rotate-90'
                }`} />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}

// Admin Filter Tabs
interface AdminFilterTabsProps {
  tabs: {
    key: string
    label: string
    count?: number
  }[]
  activeTab: string
  onChange: (tab: string) => void
}

export function AdminFilterTabs({
  tabs,
  activeTab,
  onChange,
}: AdminFilterTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm samsung-body font-medium transition-all duration-300 ${
            activeTab === tab.key
              ? 'bg-white text-samsung-blue shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.key
                ? 'bg-samsung-blue/10 text-samsung-blue'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Admin Search Input
interface AdminSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: AdminSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 samsung-body text-gray-900 placeholder-gray-400 focus:border-samsung-blue focus:ring-2 focus:ring-samsung-blue/20 transition-all duration-300"
      />
    </div>
  )
}

// Admin Loading Spinner
export function AdminLoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex justify-center py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-samsung-blue/20 border-t-samsung-blue`} />
    </div>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'active' | 'completed' | 'archived' | 'draft' | 'published' | 'pending' | string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-700 ring-green-600/20',
    completed: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    archived: 'bg-gray-100 text-gray-600 ring-gray-600/20',
    draft: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    published: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    pending: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ring-1 ring-inset ${statusStyles[status] || statusStyles.draft} ${sizeStyles[size]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Admin Modal Component
interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: AdminModalProps) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`glass-card rounded-3xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <h3 className="text-xl samsung-heading text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm samsung-body text-gray-600">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-6 border-t border-gray-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
