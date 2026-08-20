import { Routes, Route } from 'react-router-dom'
import { HomeScreen } from './hub/HomeScreen'
import { SettingsScreen } from './hub/SettingsScreen'
import { GAME_REGISTRY } from './hub/GameRegistry'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      {GAME_REGISTRY.map((game) => (
        <Route key={game.id} path={game.route} element={<game.Component />} />
      ))}
    </Routes>
  )
}
