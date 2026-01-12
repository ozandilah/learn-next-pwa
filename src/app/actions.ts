'use server'

import webpush, { PushSubscription } from 'web-push'

/**
 * Configure VAPID details for Web Push
 * VAPID (Voluntary Application Server Identification) adalah protokol
 * yang memungkinkan server mengirim push notification dengan aman
 */
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Change this to your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

/**
 * In-memory storage untuk subscriptions
 * 🔴 PRODUCTION WARNING: Gunakan database seperti PostgreSQL, MongoDB, atau Redis
 * untuk production environment untuk persistence dan scalability
 * 
 * Example dengan Prisma:
 * await prisma.pushSubscription.create({
 *   data: {
 *     endpoint: sub.endpoint,
 *     keys: sub.keys,
 *     userId: userId // untuk multi-user support
 *   }
 * })
 */
let subscription: PushSubscription | null = null

/**
 * Subscribe user ke push notifications
 * Menyimpan subscription object yang diterima dari client
 * 
 * @param sub - PushSubscription object dari browser
 * @returns Success status
 */
export async function subscribeUser(sub: PushSubscription) {
  try {
    subscription = sub
    
    // 🔴 PRODUCTION: Store in database
    // Example:
    // await db.subscriptions.create({ 
    //   data: {
    //     endpoint: sub.endpoint,
    //     p256dh: sub.keys.p256dh,
    //     auth: sub.keys.auth,
    //     userAgent: headers().get('user-agent'),
    //     createdAt: new Date()
    //   } 
    // })
    
    console.log('User subscribed successfully:', {
      endpoint: sub.endpoint.substring(0, 50) + '...',
    })
    
    return { success: true, message: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error subscribing user:', error)
    return { success: false, error: 'Failed to subscribe user' }
  }
}

/**
 * Unsubscribe user dari push notifications
 * Menghapus subscription dari storage
 * 
 * @returns Success status
 */
export async function unsubscribeUser() {
  try {
    subscription = null
    
    // 🔴 PRODUCTION: Remove from database
    // Example:
    // await db.subscriptions.delete({ 
    //   where: { userId: currentUserId } 
    // })
    
    console.log('User unsubscribed successfully')
    
    return { success: true, message: 'Unsubscribed successfully' }
  } catch (error) {
    console.error('Error unsubscribing user:', error)
    return { success: false, error: 'Failed to unsubscribe user' }
  }
}

/**
 * Send push notification ke subscribed user
 * 
 * @param message - Message content untuk notification
 * @returns Success status
 */
export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error('No subscription available. User must subscribe first.')
  }

  try {
    // Prepare notification payload
    const payload = JSON.stringify({
      title: 'Next.js PWA Tutorial',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      timestamp: Date.now(),
      data: {
        url: '/',
        customData: 'You can add any custom data here',
      },
    })

    // Send notification using web-push library
    await webpush.sendNotification(subscription, payload)
    
    console.log('Notification sent successfully')
    
    return { 
      success: true, 
      message: 'Notification sent successfully' 
    }
  } catch (error: any) {
    console.error('Error sending push notification:', error)
    
    // Handle expired/invalid subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      subscription = null
      
      // 🔴 PRODUCTION: Remove from database
      // await db.subscriptions.delete({ where: { endpoint: subscription.endpoint } })
      
      return { 
        success: false, 
        error: 'Subscription expired. Please subscribe again.' 
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to send notification' 
    }
  }
}

/**
 * Get subscription status
 * Useful untuk checking if user is subscribed
 * 
 * @returns Subscription status
 */
export async function getSubscriptionStatus() {
  return {
    isSubscribed: subscription !== null,
    endpoint: subscription?.endpoint || null,
  }
}

/**
 * Send notification to multiple users (bulk send)
 * 🔴 PRODUCTION: Fetch subscriptions from database
 * 
 * @param message - Message untuk semua users
 * @param userIds - Optional array of specific user IDs
 * @returns Results of bulk send operation
 */
export async function sendBulkNotifications(
  message: string,
  userIds?: string[]
) {
  try {
    // 🔴 PRODUCTION: Fetch from database
    // const subscriptions = await db.subscriptions.findMany({
    //   where: userIds ? { userId: { in: userIds } } : {}
    // })
    
    // For now, just use single subscription as example
    if (!subscription) {
      return { 
        success: false, 
        error: 'No subscriptions available',
        sent: 0,
        failed: 0 
      }
    }
    
    const payload = JSON.stringify({
      title: 'Bulk Notification',
      body: message,
      icon: '/icon-192x192.png',
    })
    
    // Send to all subscriptions
    const results = await Promise.allSettled([
      webpush.sendNotification(subscription, payload)
    ])
    
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    return { 
      success: true, 
      sent, 
      failed,
      message: `Sent ${sent} notifications, ${failed} failed` 
    }
  } catch (error) {
    console.error('Error sending bulk notifications:', error)
    return { 
      success: false, 
      error: 'Failed to send bulk notifications',
      sent: 0,
      failed: 0
    }
  }
}
