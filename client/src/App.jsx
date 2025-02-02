import Chat from './components/Chat.jsx'

function App() {
  return (
    <div style={{ display: "flex",flexDirection:"column", alignItems: "center", justifyContent: "center", width:"100vw" }}>
      <h1>Todo ChatBot</h1>
      <Chat />
    </div>
  )
}

export default App