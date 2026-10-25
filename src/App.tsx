import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { useStore } from './lib/store'
import { bgStyle, isLight } from './lib/util'
import AlbumPage from './pages/AlbumPage'
import AlbumsPage from './pages/AlbumsPage'
import ItemPage from './pages/ItemPage'
import PicturesPage from './pages/PicturesPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'

// アイテムが変わったら表示状態をリセット
const ItemRoute = () => <ItemPage key={useParams().id} />

export default function App() {
  const { settings } = useStore()
  return (
    <div className={'app' + (isLight(settings.bgColor) && !settings.bgImageUrl ? ' light' : '')} style={bgStyle(settings.bgColor, settings.bgImageUrl)}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AlbumsPage />} />
          <Route path="/pictures" element={<PicturesPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/item/:id" element={<ItemRoute />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<AlbumsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
