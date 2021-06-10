import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import { CookieAttributes } from 'js-cookie'

const domainAtom = atom<string>('')

export const useCookieOptions = (): CookieAttributes => {
  const [domain] = useAtom(domainAtom)
  return {
    sameSite: 'strict',
    secure: domain === 'pooltogether.com',
    domain: domain && `.${domain}`
  }
}

export const useInitCookieOptions = (domain: string) => {
  const [, setDomain] = useAtom(domainAtom)
  useEffect(() => {
    setDomain(domain)
  }, [domain])
}
