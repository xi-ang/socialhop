interface Post {
    id: string;
    authorId: string;
    content: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    comments: {
      id: string;
      content: string;
      createdAt: Date;
      author: {
        id: string;
        username: string | null;
        image: string | null;
        name: string | null;
      };
    }[];
    likes: {
      userId: string;
    }[];
    _count: {
      likes: number;
      comments: number;
    };
  }