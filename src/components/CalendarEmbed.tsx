import Cal, { getCalApi } from "@calcom/embed-react"
import { useEffect } from "react"

interface CalendarEmbedProps {
  calLink?: string // e.g. "floorplay/15min"
}

export default function CalendarEmbed({ calLink }: CalendarEmbedProps) {
  const link = calLink || (import.meta as any).env?.VITE_CALENDAR_LINK || 'floorplay/15min'

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "15min" })
      cal("ui", { 
        hideEventTypeDetails: false, 
        layout: "month_view" 
      })
    })()
  }, [])

  return (
    <Cal 
      namespace="15min"
      calLink={link}
      style={{
        width: "100%",
        height: "100%",
        overflow: "scroll"
      }}
      config={{
        layout: "month_view"
      }}
    />
  )
}
