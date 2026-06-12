export function ArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 53.572 51.845"
      width={size}
      height={(size * 51.845) / 53.572}
      fill="currentColor"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M10.369,28.803l20.594,23.042h-7.777L0,25.922,23.186,0h7.777L10.369,23.042h43.203v5.761H10.369Z" />
    </svg>
  )
}

export function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 53.572 51.845"
      width={size}
      height={(size * 51.845) / 53.572}
      fill="currentColor"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M0,23.042h43.203L22.609,0h7.777l23.186,25.922-23.186,25.923h-7.777l20.594-23.042H0v-5.761Z" />
    </svg>
  )
}
