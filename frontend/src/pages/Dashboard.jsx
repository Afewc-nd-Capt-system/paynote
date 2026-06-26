import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices, checkoutBilling } from '../api.js'
import PageHeader from '../components/PageHeader'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

function Dashboard({ user }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [billingError, setBillingError] = useState('')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setError('')
      const data = await getInvoices()
      setInvoices(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  // ========================
  // OPTIMIZED WITH useMemo
  // ========================
  const { totalPaid, totalUnpaid, paidInvoicesCount, unpaidInvoicesCount, paymentRate, stats } = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid')
    const unpaid = invoices.filter(i => i.status === 'unpaid')

    const totalPaid = paid.reduce((sum, i) => sum + (i.amount || 0), 0)
    const totalUnpaid = unpaid.reduce((sum, i) => sum + (i.amount || 0), 0)
    const paidCount = paid.length
    const unpaidCount = unpaid.length
    const totalInvoices = invoices.length
    const paymentRate = totalInvoices > 0 ? ((paidCount / totalInvoices) * 100).toFixed(1) : 0

    const stats = [
      { label: 'Total Revenue', value: `₦${totalPaid.toFixed(2)}`, color: '#34c759', icon: '💵' },
      { label: 'Pending Amount', value: `₦${totalUnpaid.toFixed(2)}`, color: '#ff3b30', icon: '⏳' },
      { label: 'Payment Rate', value: `${paymentRate}%`, color: '#007aff', icon: '📊' },
      { label: 'Total Invoices', value: totalInvoices, color: '#ff9500', icon: '📄' },
    ]

    return { totalPaid, totalUnpaid, paidInvoicesCount: paidCount, unpaidInvoicesCount: unpaidCount, paymentRate, stats }
  }, [invoices])

  // Memoized Analytics
  const analytics = useMemo(() => {
    const now = new Date()

    // Daily profits (last 30 days)
    const dailyProfits = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (29 - i))
      const dayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date)
        return invDate.toDateString() === date.toDateString() && inv.status === 'paid'
      })
      return dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    })

    // Weekly profits (last 4 weeks)
    const weeklyProfits = Array.from({ length: 4 }, (_, i) => {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() - (i * 7))
      const dayOfWeek = targetDate.getDay()
      const weekStart = new Date(targetDate)
      weekStart.setDate(targetDate.getDate() - dayOfWeek)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date)
        return invDate >= weekStart && invDate <= weekEnd && inv.status === 'paid'
      })
      return weekInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    }).reverse()

    // Monthly profits (last 12 months)
    const monthlyProfits = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date)
        return invDate.getMonth() === monthDate.getMonth() &&
               invDate.getFullYear() === monthDate.getFullYear() &&
               inv.status === 'paid'
      })
      return monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    }).reverse()

    return { dailyProfits, weeklyProfits, monthlyProfits }
  }, [invoices])

  // Memoized Chart Data
  const salesChartData = useMemo(() => ({
    labels: Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [{
      label: 'Daily Sales (₦)',
      data: analytics.dailyProfits,
      borderColor: '#007AFF',
      backgroundColor: '#007AFF20',
      tension: 0.4,
      fill: true,
    }]
  }), [analytics.dailyProfits])

  const salesChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₦' + value.toLocaleString()
          }
        }
      }
    }
  }

  const paidUnpaidData = useMemo(() => ({
    labels: ['Paid', 'Unpaid'],
    datasets: [{
      data: [totalPaid, totalUnpaid],
      backgroundColor: ['#34c759', '#ff3b30'],
      borderWidth: 0,
    }]
  }), [totalPaid, totalUnpaid])

  const paidUnpaidOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `₦${context.parsed.toLocaleString()} (${percentage}%)`
          }
        }
      }
    }
  }

  const recentInvoices = useMemo(() => {
    return [...invoices].slice(-5).reverse()
  }, [invoices])

  // Billing logic (kept as is)
  const billing = user?.billing || {}
  const billingStatus = billing.status || 'trial_pending'
  const trialEndsAt = billing.trialEndsAt ? new Date(billing.trialEndsAt) : null
  const nextBillingDue = billing.nextBillingDue ? new Date(billing.nextBillingDue) : null

  const isTrialPending = billingStatus === 'trial_pending'
  const isTrialActive = billingStatus === 'trial' && trialEndsAt && new Date() < trialEndsAt
  const isPaymentDue = billingStatus === 'charge_due' || billingStatus === 'pending_payment'
  const subscriptionActive = billingStatus === 'active'

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const billingMessage = isTrialPending
    ? 'Create your first invoice to start your free 30-day trial.'
    : isTrialActive
      ? `Free trial active until ${formatDate(trialEndsAt)}. Upgrade now to avoid interruption.`
      : isPaymentDue
        ? 'Your trial has ended. Payment is required to continue using Paynote.'
        : subscriptionActive
          ? `Subscription active. Next billing due ${formatDate(nextBillingDue)}.`
          : 'Review your billing status.'

  const billingActionText = isPaymentDue
    ? 'Pay Now'
    : isTrialActive
      ? 'Upgrade'
      : isTrialPending
        ? 'Start Subscription'
        : null

  const handleBillingCheckout = async () => {
    setBillingError('')
    setCheckoutMessage('')
    setCheckoutLoading(true)
    try {
      const data = await checkoutBilling()
      if (data.authorizationUrl) {
        window.open(data.authorizationUrl, '_blank')
        setCheckoutMessage('Opening payment link. Complete the checkout to activate your plan.')
      } else {
        setBillingError('Unable to open payment link. Please try again.')
      }
    } catch (err) {
      setBillingError(err.message || 'Failed to initialize payment checkout')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your business"
      />

      {/* Billing Banner */}
      <div style={{
        background: isPaymentDue ? '#FFF1F0' : '#EFF6FF',
        border: `1px solid ${isPaymentDue ? '#F8D7DA' : '#B6E0FE'}`,
        color: isPaymentDue ? '#842029' : '#0F172A',
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div>
            <p style={{
              fontSize: 14,
              fontWeight: 700,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>{billingStatus.replace('_', ' ').toUpperCase()}</p>
            <p style={{
              fontSize: 16,
              margin: '8px 0 0',
              lineHeight: 1.5
            }}>{billingMessage}</p>
          </div>
          {billingActionText && (
            <button
              onClick={handleBillingCheckout}
              disabled={checkoutLoading}
              style={{
                padding: '14px 22px',
                borderRadius: 14,
                background: isPaymentDue ? '#D92D20' : '#007AFF',
                color: 'white',
                border: 'none',
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: 14,
                minWidth: 160
              }}
            >
              {checkoutLoading ? 'Preparing payment...' : billingActionText}
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}>
          <div style={{ fontSize: 13, color: '#475569' }}>
            <strong>Plan:</strong> {billing.plan || 'Free Trial'}
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>
            <strong>Monthly Price:</strong> {billing.monthlyChargeNaira ? `₦${billing.monthlyChargeNaira.toLocaleString()}` : '₦3,000'}
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>
            <strong>Next due:</strong> {subscriptionActive ? formatDate(nextBillingDue) : trialEndsAt ? formatDate(trialEndsAt) : 'Not yet started'}
          </div>
        </div>

        {billingError && (
          <div style={{
            background: '#FFE5E5',
            color: '#842029',
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 13,
            border: '1px solid #F5C2C7'
          }}>
            {billingError}
          </div>
        )}
        {checkoutMessage && (
          <div style={{
            background: '#F0F9FF',
            color: '#0F172A',
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 13,
            border: '1px solid #B6E0FE'
          }}>
            {checkoutMessage}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: '#FFE5E5',
          color: '#C41E3A',
          padding: '12px 16px',
          borderRadius: 12,
          fontSize: 14,
          marginBottom: 20,
          border: '1px solid #FFB3B3'
        }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: 'clamp(12px, 3vw, 16px)',
        marginBottom: 32
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            background: 'white',
            borderRadius: 18,
            padding: 'clamp(18px, 4vw, 24px) clamp(16px, 3.8vw, 20px)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)'
          }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${stat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              marginBottom: 14
            }}>
              {stat.icon}
            </div>
            <p style={{
              fontSize: 13,
              color: '#86868b',
              fontWeight: 500,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}>{stat.label}</p>
            <p style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#1d1d1f',
              letterSpacing: '-0.5px'
            }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 'clamp(16px, 4vw, 24px)',
        marginBottom: 32
      }}>
        {/* Sales Chart */}
        <div style={{
          background: 'white',
          borderRadius: 18,
          padding: 'clamp(18px, 4vw, 24px) clamp(16px, 3.8vw, 20px)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          gridColumn: '1 / -1'
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 20
          }}>Sales Trend (Last 30 Days)</h2>
          <div style={{ height: 'clamp(220px, 48vw, 300px)' }}>
            <Line data={salesChartData} options={salesChartOptions} />
          </div>
        </div>

        {/* Profit Overview */}
        <div style={{
          background: 'white',
          borderRadius: 18,
          padding: '24px 20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 20
          }}>Profit Overview</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f5f5f7',
              borderRadius: 12
            }}>
              <span style={{ fontSize: 14, color: '#86868b' }}>This Week</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>
                ₦{analytics.weeklyProfits[analytics.weeklyProfits.length - 1]?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f5f5f7',
              borderRadius: 12
            }}>
              <span style={{ fontSize: 14, color: '#86868b' }}>Last Week</span>
              <span style={{ fontSize: 14, color: '#86868b' }}>
                ₦{analytics.weeklyProfits[analytics.weeklyProfits.length - 2]?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f5f5f7',
              borderRadius: 12
            }}>
              <span style={{ fontSize: 14, color: '#86868b' }}>This Month</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>
                ₦{analytics.monthlyProfits[analytics.monthlyProfits.length - 1]?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#007AFF15',
              borderRadius: 12,
              border: '1px solid #007AFF30'
            }}>
              <span style={{ fontSize: 14, color: '#007AFF' }}>Total Revenue</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#007AFF' }}>
                ₦{totalPaid.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Paid vs Unpaid Pie Chart */}
        <div style={{
          background: 'white',
          borderRadius: 18,
          padding: '24px 20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 20
          }}>Payment Status</h2>
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie data={paidUnpaidData} options={paidUnpaidOptions} />
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '24px 20px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        marginBottom: 32
      }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#1d1d1f',
          marginBottom: 16
        }}>Quick Actions</h2>
        <button
          onClick={() => navigate('/create')}
          style={{
            padding: '14px 28px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 4px 16px rgba(0,122,255,0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)'
            e.target.style.boxShadow = '0 6px 20px rgba(0,122,255,0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 16px rgba(0,122,255,0.3)'
          }}
        >
          + Create New Invoice
        </button>
      </div>

      {/* Recent Invoices */}
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '24px 20px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1d1d1f'
          }}>Recent Invoices</h2>
          <button
            onClick={() => navigate('/invoices')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007aff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View All →
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#86868b', textAlign: 'center', padding: 40 }}>Loading...</p>
        ) : recentInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ color: '#86868b', fontSize: 15 }}>No invoices yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentInvoices.map(inv => (
              <div key={inv.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 18px',
                borderRadius: 14,
                background: '#f5f5f7',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#eeeef0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: '#1d1d1f' }}>{inv.customer}</p>
                  <p style={{ fontSize: 13, color: '#86868b', marginTop: 2 }}>{inv.item}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#1d1d1f' }}>₦{inv.amount.toFixed(2)}</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 4,
                    background: inv.status === 'paid' ? '#34c75920' : '#ff3b3020',
                    color: inv.status === 'paid' ? '#34c759' : '#ff3b30'
                  }}>
                    {inv.status === 'paid' ? '● Paid' : '● Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
