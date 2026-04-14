import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'

export function useRealtimeNotifications() {
  const { collaborateur } = useAuthStore()

  useEffect(() => {
    if (!collaborateur) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'taches',
          filter: `assignee_id=eq.${collaborateur.id}`,
        },
        (payload) => {
          const tache = payload.new as { titre: string }
          toast.info(`📋 Nouvelle tâche : "${tache.titre}"`, {
            description: 'Une tâche vous a été assignée',
            duration: 6000,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [collaborateur?.id])
}
