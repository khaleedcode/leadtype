import { useState } from 'react'
import TypingBox from './Components/typingbox'
import { GlobalStyles } from './Styles/global.js'
import UpperMenu from './Components/UpperMenu'
function App() {
  const [count, setCount] = useState(0)

  return (
      <div className='canvas'>
        <GlobalStyles />
        <div>haha</div>
        <UpperMenu />
        <TypingBox />
        <div>hehe</div>
      </div>
  )
}

export default App
