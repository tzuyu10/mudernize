import LoginScreen from './LoginScreen'

export default function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return <LoginScreen error={searchParams.error} message={searchParams.message} />
}
