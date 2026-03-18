import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import { listForumPosts, createForumPost, addForumComment } from "../../services/forum.service";
import { getUser } from "../../utils/authUtils";

export default function ForumScreen() {
  const [user] = useState(getUser());
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = async () => {
    try {
      const data = await listForumPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "No se pudo cargar el foro");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await createForumPost({ title, content, tags: [] });
      setTitle("");
      setContent("");
      toast.success("Publicación creada");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "No se pudo crear la publicación");
    }
  };

  const onComment = async (postId) => {
    const text = prompt("Escribe tu comentario:");
    if (!text) return;
    try {
      await addForumComment(postId, { content: text });
      toast.success("Comentario agregado");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "No se pudo comentar");
    }
  };

  return (
    <>
      <Header user={user} />

      <main className="container my-4">
        <h3>Foro de Mecánicos</h3>

        <form className="card p-3 mb-4" onSubmit={onCreate}>
          <input
            className="form-control mb-2"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="form-control mb-2"
            placeholder="Contenido"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button className="btn btn-chapacar" type="submit">
            Publicar
          </button>
        </form>

        {posts.map((p) => (
          <div key={p._id} className="card p-3 mb-3">
            <div className="d-flex justify-content-between">
              <div>
                <h5 className="mb-1">{p.title}</h5>
                <small className="text-muted">
                  Por {p.author?.name || "Usuario"} • {new Date(p.createdAt).toLocaleString()}
                </small>
              </div>
              <button className="btn btn-outline-primary btn-sm" onClick={() => onComment(p._id)}>
                Comentar
              </button>
            </div>

            <p className="mt-3 mb-2">{p.content}</p>

            {p.comments?.length > 0 && (
              <div className="mt-2">
                <small className="text-muted fw-bold">Comentarios</small>
                <ul className="mt-2">
                  {p.comments.map((c) => (
                    <li key={c._id}>
                      <b>{c.author?.name || "Usuario"}:</b> {c.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </main>

      <Footer />
    </>
  );
}
