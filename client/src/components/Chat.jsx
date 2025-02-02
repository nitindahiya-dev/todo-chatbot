import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';

const Chat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [todos, setTodos] = useState([]);
  const [open, setOpen] = useState(false);

  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => setOpen(false);

  // Function to fetch todos from the backend
  const fetchTodos = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/todos');
      setTodos(res.data.todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Fetch todos when component mounts
  useEffect(() => {
    fetchTodos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Send the chat command to the backend
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: input
      });

      // Update chat messages
      setMessages(prev => [
        ...prev,
        { type: 'user', content: input },
        { type: 'bot', content: response.data.message }
      ]);
      setInput('');

      // If the response includes updated todos (or if the action modifies todos),
      // refresh the todos table.
      if (response.data.todos || response.data.message.toLowerCase().includes("todo")) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, minWidth: 600, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Todo Chatbot
      </Typography>
      <Typography variant="p" gutterBottom>
        Hi, I am Todo chatbot.
      </Typography>
      <Typography variant="p" gutterBottom>
        I can create, search and delete your todos.
      </Typography>
      <Box sx={{ height: '400px', overflowY: 'auto', mb: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemText
                primary={msg.type === 'user' ? 'You' : 'Bot'}
                secondary={msg.content.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                sx={{
                  textAlign: msg.type === 'user' ? 'right' : 'left',
                  bgcolor: msg.type === 'user' ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: 2,
                  p: 1
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <form onSubmit={handleSubmit}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say hi..."
            variant="outlined"
          />
          <Button type="submit" variant="contained" color="primary">
            Send
          </Button>
        </Box>
      </form>

      {/* Divider and Table below chat */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" gutterBottom>
        Todo List
      </Typography>




      <div>
        <button onClick={onOpenModal}>My Todo</button>
        <Modal open={open} onClose={onCloseModal} center>
          <p>
            {todos.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    {/* You can add more headers if needed */}
                    <TableCell>Todo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todos.map((todo) => (
                    <TableRow key={todo.id}>
                      <TableCell>{todo.todo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography>No todos available.</Typography>
            )}
          </p>
        </Modal>
      </div>



    </Paper>
  );
};

export default Chat;
