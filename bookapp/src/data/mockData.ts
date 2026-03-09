import artOfWar from "@/assets/covers/art-of-war.jpg";
import pridePrejudice from "@/assets/covers/pride-prejudice.jpg";
import nineteen84 from "@/assets/covers/1984.jpg";
import atomicHabits from "@/assets/covers/atomic-habits.jpg";
import sapiens from "@/assets/covers/sapiens.jpg";
import meditations from "@/assets/covers/meditations.jpg";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  description?: string;
}

export interface Story {
  id: string;
  username: string;
  avatar: string;
  bookTitle?: string;
  content: string;
  type: "quote" | "recommendation" | "activity" | "discussion";
}

export interface Post {
  id: string;
  username: string;
  avatar: string;
  timeAgo: string;
  type: "quote" | "review" | "recommendation" | "discussion";
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  content: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
}

export interface ActivityDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}

export const books: Book[] = [
  { id: "1", title: "Meditations", author: "Marcus Aurelius", cover: meditations, progress: 67 },
  { id: "2", title: "The Art of War", author: "Sun Tzu", cover: artOfWar, progress: 100 },
  { id: "3", title: "1984", author: "George Orwell", cover: nineteen84, progress: 34 },
  { id: "4", title: "Atomic Habits", author: "James Clear", cover: atomicHabits, progress: 12 },
  { id: "5", title: "Pride and Prejudice", author: "Jane Austen", cover: pridePrejudice, progress: 0 },
  { id: "6", title: "Sapiens", author: "Yuval Noah Harari", cover: sapiens, progress: 0 },
];

export const stories: Story[] = [
  { id: "1", username: "sarah_reads", avatar: "SR", content: "\"The happiness of your life depends upon the quality of your thoughts.\"", type: "quote", bookTitle: "Meditations" },
  { id: "2", username: "bookworm42", avatar: "BW", content: "Just finished 1984. Mind-blowing ending.", type: "activity" },
  { id: "3", username: "lit_explorer", avatar: "LE", content: "Everyone should read Atomic Habits this year.", type: "recommendation", bookTitle: "Atomic Habits" },
  { id: "4", username: "deep_reader", avatar: "DR", content: "What does Orwell really mean by doublethink?", type: "discussion" },
  { id: "5", username: "page_turner", avatar: "PT", content: "Pride and Prejudice is timeless.", type: "recommendation", bookTitle: "Pride and Prejudice" },
];

export const posts: Post[] = [
  {
    id: "1", username: "sarah_reads", avatar: "SR", timeAgo: "2h",
    type: "quote", bookTitle: "Meditations", bookAuthor: "Marcus Aurelius", bookCover: meditations,
    content: "\"You have power over your mind — not outside events. Realize this, and you will find strength.\"",
    likes: 128, comments: 23, liked: false, saved: false,
  },
  {
    id: "2", username: "bookworm42", avatar: "BW", timeAgo: "4h",
    type: "review", bookTitle: "1984", bookAuthor: "George Orwell", bookCover: nineteen84,
    content: "A haunting reminder of what happens when truth becomes subjective. Orwell's vision feels more relevant now than ever. The last 50 pages left me speechless.",
    likes: 256, comments: 45, liked: true, saved: true,
  },
  {
    id: "3", username: "lit_explorer", avatar: "LE", timeAgo: "6h",
    type: "recommendation", bookTitle: "Atomic Habits", bookAuthor: "James Clear", bookCover: atomicHabits,
    content: "If you're looking for a book that will genuinely change your daily routine, this is it. Small changes, remarkable results.",
    likes: 89, comments: 12, liked: false, saved: false,
  },
  {
    id: "4", username: "deep_reader", avatar: "DR", timeAgo: "1d",
    type: "discussion",
    content: "What's the most underrated book you've read this year? I'll go first: Sapiens completely changed how I see human history.",
    likes: 342, comments: 87, liked: false, saved: false,
  },
];

export function generateActivityData(): ActivityDay[] {
  const days: ActivityDay[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const level = Math.random() > 0.3 ? (Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4 : 0;
    days.push({ date: date.toISOString().split("T")[0], level });
  }
  return days;
}

export const sampleBookContent = [
  "Chapter 1: The Nature of Things\n\nFrom my grandfather Verus I learned good morals and the government of my temper. From the reputation and remembrance of my father, modesty and a manly character.",
  "From my mother, piety and beneficence, and abstinence, not only from evil deeds, but even from evil thoughts; and further, simplicity in my way of living, far removed from the habits of the rich.",
  "From my great-grandfather, not to have frequented public schools, and to have had good teachers at home, and to know that on such things a man should spend liberally.",
  "From my governor, to be neither of the green nor of the blue party at the games in the Circus, nor a partizan either of the Parmularius or the Scutarius at the gladiators' fights.",
  "From him I learned endurance of labour, and to want little, and to work with my own hands, and not to meddle with other people's affairs, and not to be ready to listen to slander.",
];
