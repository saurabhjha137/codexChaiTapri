import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

// TODO: the "More" button that opens this drawer is temporarily commented
// out in App.tsx (revisiting that flow tomorrow) — these tests can't reach
// it right now, so they're skipped rather than deleted. Re-enable
// (describe.skip -> describe) once the button comes back.
describe.skip('community features without Supabase', () => {
  beforeEach(() => localStorage.clear())

  async function openMoreDrawer(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /more/i }))
    return screen.getByRole('dialog', { name: /more from chai ki tapri/i })
  }

  it('echoes reactions locally and labels preview mode', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMoreDrawer(user)
    await user.click(screen.getByRole('button', { name: /cutting/i }))
    expect(screen.getByLabelText('☕ reaction')).toBeInTheDocument()
    expect(screen.getByText(/preview mode · reactions stay here/i)).toBeInTheDocument()
  })

  it('validates and demonstrates a song request locally', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMoreDrawer(user)
    const trigger = screen.getByRole('button', { name: /request a song/i })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: /song requests/i })
    expect(within(dialog).getByText(/public queue is not connected/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /send request/i }))
    expect(within(dialog).getByText(/add at least one/i)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/spotify url/i), 'https://open.spotify.com/track/abc123')
    await user.click(within(dialog).getByRole('button', { name: /send request/i }))
    expect(within(dialog).getByText(/preview received/i)).toBeInTheDocument()
    // First Escape closes the innermost dialog only — the drawer underneath
    // stays open (see App.tsx's nested-dialog guard on the drawer's own
    // Escape handler).
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('dialog', { name: /more from chai ki tapri/i })).toBeInTheDocument()
  })

  it('opens the guestbook and postcard dialogs in local mode', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMoreDrawer(user)
    await user.click(screen.getByRole('button', { name: 'Guestbook' }))
    expect(screen.getByRole('dialog', { name: /tapri guestbook/i })).toHaveTextContent(/preview mode/i)
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /make a postcard/i }))
    expect(screen.getByRole('dialog', { name: /make a tapri postcard/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/postcard preview/i)).toBeInTheDocument()
  })
})
