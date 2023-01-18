import { atom, useAtom } from 'jotai'
import { CookieAttributes } from 'js-cookie'
import { useEffect } from 'react'

const domainAtom = atom<string>('')

export const useCookieOptions = (): CookieAttributes => {
  const [domain] = useAtom(domainAtom)
  return {
    sameSite: 'strict',
    secure: domain === 'pooltogether.com',
    domain: domain && `.${domain}`
  }
}

/**
 * Call once
 * @param domain
 */
export const useInitCookieOptions = (domain: string) => {
  const [, setDomain] = useAtom(domainAtom)
  useEffect(() => {
    setDomain(domain)
  }, [domain])
}
