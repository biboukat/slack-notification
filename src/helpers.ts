// Converts start and end dates into a duration string
export function compute_duration({start, end}: {start: Date; end: Date}): string {
    // FIXME: https://github.com/microsoft/TypeScript/issues/2361
    const duration = end.valueOf() - start.valueOf()
    let delta = duration / 1000
    const days = Math.floor(delta / 86400)
    delta -= days * 86400
    const hours = Math.floor(delta / 3600) % 24
    delta -= hours * 3600
    const minutes = Math.floor(delta / 60) % 60
    delta -= minutes * 60
    const seconds = Math.floor(delta % 60)
    // Format duration sections
    const format_duration = (
      value: number,
      text: string,
      hide_on_zero: boolean
    ): string => (value <= 0 && hide_on_zero ? '' : `${value}${text} `)
  
    return (
      format_duration(days, 'd', true) +
      format_duration(hours, 'h', true) +
      format_duration(minutes, 'm', true) +
      format_duration(seconds, 's', false).trim()
    )
  }