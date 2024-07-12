'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ClassInfoCard from '@/components/ClassInfoCard';
import PostList from '@/components/PostList';
import ProblemSetOverlay from '@/components/ProblemSetOverlay';
import AddPostForm from '@/components/AddPostForm'; // Import the AddPostForm component
import { Post, ClassData, User, Problem } from '@/types'; // Make sure to import types as needed

const formatDate = (isoDate: string): string => {
  const datePart = isoDate.split('T')[0];
  return datePart;
};

const ClassPage = ({ params }: { params: { classId: string } }) => {
  const [activeItem, setActiveItem] = useState<string>('posts');
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [showProblemSetOverlay, setShowProblemSetOverlay] = useState<boolean>(false);
  const [newPost, setNewPost] = useState<Post>({
    _id: '',
    title: '',
    description: '',
    date: '',
    content: '',
    dueDate: '',
    materials: [],
  });

  const router = useRouter();
  const { classId } = params;

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data) {
        const formattedPosts = data.posts.map((post: Post) => ({
          ...post,
          date: formatDate(post.date),
        }));
        setClassData({ ...data, posts: formattedPosts });
      } else {
        router.push('/enrolled');
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      router.push('/enrolled');
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data: User = await response.json();
      setIsTeacher(data.isTeacher);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleMenuItemClick = (itemId: string) => {
    setActiveItem(itemId);
  };

  const handlePostClick = (postId: string) => {
    router.push(`/classes/${classId}/posts/${postId}`);
  };

  const handleCloseForm = () => {
    setShowAddPostForm(false);
  };

  const handlePostDelete = async (postId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/posts/${postId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setClassData((prevData) => ({
          ...prevData,
          posts: prevData.posts.filter((post) => post._id !== postId),
        }));
      } else {
        const errorData = await response.json();
        console.error('Error deleting post:', errorData);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleSelectProblems = (selectedProblems: Problem[]) => {
    setNewPost((prevPost) => ({
      ...prevPost,
      materials: [...prevPost.materials, ...selectedProblems],
    }));
  };

  const handlePostFormSubmit = async (postData: any) => {
    try {
      // Format materials correctly
      const formattedPostData = {
        ...postData,
        materials: postData.materials.map((material: any) => ({
          id: material.id,
          title: material.title,
          titleSlug: material.titleSlug,
          type: material.type,
          link: material.link,
        })),
      };
  
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedPostData),
      });
  
      if (response.ok) {
        setNewPost({
          _id: '',
          title: '',
          description: '',
          date: '',
          content: '',
          dueDate: '',
          materials: [],
        });
        setShowAddPostForm(false);
        fetchClassData();
      } else {
        const errorData = await response.json();
        console.error('Error creating post:', errorData);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  useEffect(() => {
    fetchClassData();
    fetchUserData();
  }, [classId, router]);

  if (!classData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1" style={{ marginTop: '56px' }}>
        <Sidebar onItemClick={handleMenuItemClick} />
        <div className="flex-1 p-4 bg-gray-100 overflow-y-auto">
          <ClassInfoCard
            title={classData.title}
            description={classData.description}
            code={classData.code}
          />
          {activeItem === 'posts' && (
            <>
              {isTeacher && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowAddPostForm(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
                  >
                    Add Post
                  </button>
                  <button
                    onClick={() => setShowProblemSetOverlay(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Select from Problem Set
                  </button>
                </div>
              )}
              <PostList
                posts={classData.posts}
                onPostClick={handlePostClick}
                onDelete={handlePostDelete}
                isTeacher={isTeacher}
              />
              {showAddPostForm && (
                <AddPostForm
                  onSubmit={handlePostFormSubmit}
                  onClose={() => setShowAddPostForm(false)}
                  onSelectProblems={handleSelectProblems}
                />
              )}
            </>
          )}
        </div>
      </div>
      {showProblemSetOverlay && (
        <ProblemSetOverlay
          onClose={() => setShowProblemSetOverlay(false)}
          onSelectProblems={handleSelectProblems}
        />
      )}
    </div>
  );
};

export default ClassPage;
