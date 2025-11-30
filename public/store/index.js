const API_URL = (window.PLANTGRAM_API_URL || 'http://localhost:3000')

document.addEventListener('alpine:init', () => {
    // helper to resolve image paths returned by the API
    const resolveImage = (img) => {
        if (!img) return null;
        if (typeof img !== 'string') return img;

        // If it's already a full URL, return it.
        if (img.startsWith('http')) {
            return img;
        }

        // If it's a path starting with a slash (e.g., /uploads/...), prepend API_URL
        if (img.startsWith('/')) {
            return API_URL + img;
        }
        
        // Fallback for other cases, though the API should be consistent.
        return img;
    }
    // UI store: routing (simple hash-based)
    Alpine.store('ui', {
        route: 'login',
        init() {
            const loadRoute = () => {
                // Prefer hash-based routing, fall back to pathname so direct links like /plant-profiles work.
                let routeStr = '';
                if (location.hash && location.hash.length > 0) {
                    routeStr = location.hash.replace('#/', '')
                } else {
                    routeStr = location.pathname.replace(/^\/+|\/+$/g, '') || 'feed'
                }

                // support /posts/:id routing (either from hash or pathname)
                if (routeStr.startsWith('posts/')) {
                    const id = routeStr.split('/')[1];
                    Alpine.store('posts').getById(id);
                    this.route = 'post';
                    return;
                }
                // support /species/:id path (show species detail)
                if (routeStr.startsWith('species/')) {
                    const id = routeStr.split('/')[1];
                    location.hash = '#/species/' + id;
                    // load species detail and switch to species view
                    Alpine.store('species').getById(id);
                    this.route = 'species';
                    return;
                }

                this.route = routeStr.split('?')[0];
                // safely access auth store/user
                const authStore = Alpine.store('auth');
                const user = authStore && authStore.user;

                if (this.route === 'profile' && user && user._id) {
                    const profileStore = Alpine.store('profile');
                    if (profileStore && typeof profileStore.load === 'function') {
                        profileStore.load(user._id);
                    } else {
                        setTimeout(() => {
                            const ps = Alpine.store('profile');
                            if (ps && typeof ps.load === 'function') ps.load(user._id);
                        }, 100);
                    }
                }
                // load data for common routes
                if (this.route === 'feed') {
                    // posts store may not be available in some race cases; guard and retry briefly
                    const postsStore = Alpine.store('posts');
                    if (postsStore && typeof postsStore.load === 'function') {
                        postsStore.load();
                    } else {
                        // retry once after a short delay
                        setTimeout(() => {
                            const ps = Alpine.store('posts');
                            if (ps && typeof ps.load === 'function') ps.load();
                        }, 100);
                    }
                }
                if (this.route === 'create') {
                    // load user's plant profiles so they can be associated to a post
                    const ppStore = Alpine.store('plantProfiles');
                    if (ppStore && typeof ppStore.load === 'function') {
                        if (user && user._id) ppStore.load(user._id);
                        else ppStore.load();
                    } else {
                        setTimeout(() => {
                            const pp = Alpine.store('plantProfiles');
                            if (pp && typeof pp.load === 'function') {
                                if (user && user._id) pp.load(user._id);
                                else pp.load();
                            }
                        }, 100);
                    }
                    // ensure species list is available for the selector
                    const speciesStore = Alpine.store('species');
                    if (speciesStore && typeof speciesStore.loadAll === 'function') speciesStore.loadAll();
                    else setTimeout(() => { const s = Alpine.store('species'); if (s && typeof s.loadAll === 'function') s.loadAll(); }, 100);
                }
                if (this.route === 'plant-profiles') {
                    const pp = Alpine.store('plantProfiles');
                    if (pp && typeof pp.load === 'function') pp.load();
                    else setTimeout(() => { const p2 = Alpine.store('plantProfiles'); if (p2 && typeof p2.load === 'function') p2.load(); }, 100);
                }
                if (this.route === 'notifications') {
                    const n = Alpine.store('notifications');
                    if (n && typeof n.load === 'function') n.load();
                    else setTimeout(() => { const n2 = Alpine.store('notifications'); if (n2 && typeof n2.load === 'function') n2.load(); }, 100);
                }
                if (this.route === 'saves') {
                    const s = Alpine.store('saves');
                    if (s && typeof s.load === 'function') s.load();
                    else setTimeout(() => { const s2 = Alpine.store('saves'); if (s2 && typeof s2.load === 'function') s2.load(); }, 100);
                }
            };
            window.addEventListener('hashchange', loadRoute);
            // add scroll listener for lazy-loading feed
            let scrollDebounce = null;
            window.addEventListener('scroll', () => {
                if (scrollDebounce) clearTimeout(scrollDebounce);
                scrollDebounce = setTimeout(() => {
                    if (this.route === 'feed') {
                        const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 300);
                        if (nearBottom) Alpine.store('posts').loadMore();
                    }
                }, 150);
            });
            loadRoute();
        }
        ,
        // expose resolver so templates can call $store.ui.resolveImage(...)
        resolveImage
    })

    // Auth store
    Alpine.store('auth', {
        token: localStorage.getItem('plantgram_token') || null,
        user: (() => { try { return JSON.parse(localStorage.getItem('plantgram_user')) } catch(e){ return null } })(),
        loginForm: { email: '', password: '' },
        signupForm: { username: '', email: '', password: '' },
        async login(email, password) {
            email = email || this.loginForm.email
            password = password || this.loginForm.password
            try {
                const res = await fetch(API_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Login failed')
                this.token = data.token
                this.user = data.user
                if (this.user && this.user.profile_pic) this.user.profile_pic = resolveImage(this.user.profile_pic);
                localStorage.setItem('plantgram_token', data.token)
                localStorage.setItem('plantgram_user', JSON.stringify(data.user))
                Alpine.store('ui').route = 'feed'
                return true
            } catch (err) {
                alert(err.message || 'Login error')
                return false
            }
        },
        async signup(payload) {
            payload = payload || this.signupForm
            try {
                const res = await fetch(API_URL + '/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Signup failed')
                this.token = data.token
                this.user = data.user
                if (this.user && this.user.profile_pic) this.user.profile_pic = resolveImage(this.user.profile_pic);
                localStorage.setItem('plantgram_token', data.token)
                localStorage.setItem('plantgram_user', JSON.stringify(data.user))
                Alpine.store('ui').route = 'feed'
                return true
            } catch (err) {
                alert(err.message || 'Signup error')
                return false
            }
        },
        async verify(retries = 3) {
            if (!this.token) return false;
            // Try a few times for transient network errors before giving up.
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const res = await fetch(API_URL + '/api/auth/verify', { headers: { 'Authorization': 'Bearer ' + this.token } });
                    if (!res.ok) {
                        // If token is explicitly invalid, clear data immediately.
                        if (res.status === 401) {
                            this.logout();
                            return false;
                        }
                        // For other statuses, treat as transient and retry a few times.
                        if (attempt === retries) return false;
                        await new Promise(r => setTimeout(r, 200 * attempt));
                        continue;
                    }
                    const data = await res.json();
                    this.user = data.user;
                    if (this.user && this.user.profile_pic) this.user.profile_pic = resolveImage(this.user.profile_pic);
                    localStorage.setItem('plantgram_user', JSON.stringify(this.user));
                    return true;
                } catch (err) {
                    // network or transient error — retry a few times
                    if (attempt === retries) {
                        console.warn('verify failed after retries', err);
                        return false;
                    }
                    await new Promise(r => setTimeout(r, 200 * attempt));
                }
            }
            return false;
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('plantgram_token')
            localStorage.removeItem('plantgram_user')
            Alpine.store('ui').route = 'login'
        },
        async updateProfile(fields, file) {
            try {
                const token = this.token
                let profile_pic = null
                if (file) {
                    const fd = new FormData()
                    fd.append('image', file)
                    const up = await fetch(API_URL + '/api/upload/single', { method: 'POST', headers: token ? { 'Authorization': 'Bearer ' + token } : {}, body: fd })
                    const upData = await up.json()
                    if (!up.ok) throw new Error(upData.error || 'Upload failed')
                    profile_pic = upData.imageUrl || upData.image_url || `/uploads/${upData.filename}`
                }
                const body = Object.assign({}, fields, profile_pic ? { profile_pic } : {})
                const res = await fetch(API_URL + `/api/users/${this.user._id}`, { method: 'PUT', headers: Object.assign({'Content-Type':'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}), body: JSON.stringify(body) })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Update failed')
                this.user = data
                if (this.user && this.user.profile_pic) this.user.profile_pic = resolveImage(this.user.profile_pic)
                localStorage.setItem('plantgram_user', JSON.stringify(this.user))
                alert('Profile updated')
                return true
            } catch (err) {
                alert(err.message || 'Error updating profile')
                return false
            }
        }
    })

    // Posts store: load feed, create post, get by id
    Alpine.store('posts', {
        page: 0,
        hasMore: true,
        items: [],
        creating: false,
        loading: false,
        createForm: { file: null, title: '', description: '', plant_profile_id: '', species_id: '', tags: '' },
        current: null,
        async load(page = 0, limit = 20, append = false) {
            try {
                this.loading = true;
                const res = await fetch(API_URL + `/api/posts?page=${page}&limit=${limit}`);
                const data = await res.json();
                // normalize image urls
                const fetched = (data || []).map(p => {
                    p.image_url = resolveImage(p.image_url || p.image);
                    if (p.user_id && p.user_id.profile_pic) p.user_id.profile_pic = resolveImage(p.user_id.profile_pic);
                    // UI flags for like/save state (optimistic; server-side lookup can be added later)
                    p._liked = false;
                    p._saved = false;
                    return p;
                });
                if (append) this.items = this.items.concat(fetched);
                else this.items = fetched;
                // page/hasMore handling
                this.page = page;
                this.hasMore = (Array.isArray(data) && data.length === limit);
                // The backend now returns counts and per-user flags in the posts payload.
                // Map backend flags into UI fields and normalize image URLs.
                const mappedTargets = append ? fetched : this.items;
                for (const p of mappedTargets) {
                    p.likes_count = p.likes_count || 0;
                    p.saves_count = p.saves_count || 0;
                    p.comments_count = p.comments_count || 0;
                    p._liked = !!p.liked_by_user;
                    p._saved = !!p.saved_by_user;
                }
            } catch (err) {
                console.error('Error loading posts', err);
            } finally {
                this.loading = false;
            }
        },
        handleFile(e) {
            const file = e.target.files[0];
            this.createForm.file = file;
        },
        async createPost() {
            if (!this.createForm.title || this.createForm.title.trim() === '') return alert('Title is required');
            if (!this.createForm.file) return alert('Select an image');
            // basic client-side validation
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (this.createForm.file.size > maxSize) return alert('Image too large (max 5MB)');
            this.creating = true;
            try {
                const fd = new FormData();
                fd.append('image', this.createForm.file);
                const token = Alpine.store('auth').token;
                const uploadRes = await fetch(API_URL + '/api/upload/single', {
                    method: 'POST',
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
                    body: fd
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
                const imageUrl = uploadData.imageUrl || uploadData.image_url || `/uploads/${uploadData.filename}`;

                const tagsArr = (this.createForm.tags || '').split(',').map(t => t.trim()).filter(Boolean);
                const body = {
                    user_id: Alpine.store('auth').user?._id,
                    image_url: imageUrl,
                    title: this.createForm.title,
                    description: this.createForm.description,
                    plant_profile_id: this.createForm.plant_profile_id,
                    species_id: this.createForm.species_id || null,
                    tags: tagsArr,
                };
                const res = await fetch(API_URL + '/api/posts', {
                    method: 'POST',
                    headers: Object.assign({'Content-Type': 'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}),
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Create post failed');
                if (data) data.image_url = resolveImage(data.image_url || data.image);
                if (data) {
                    data._liked = false;
                    data._saved = false;
                }
                this.items.unshift(data);
                this.createForm = { file: null, title: '', description: '', plant_profile_id: '', species_id: '', tags: '' };
                alert('Post creado');
                Alpine.store('ui').route = 'feed';
            } catch (err) {
                alert(err.message || 'Error creando post');
            }
            finally {
                this.creating = false;
            }
        },
        async getById(id) {
            try {
                const res = await fetch(API_URL + `/api/posts/${id}`);
                const data = await res.json();
                if (data) data.image_url = resolveImage(data.image_url || data.image);
                if (data && data.user_id && data.user_id.profile_pic) data.user_id.profile_pic = resolveImage(data.user_id.profile_pic);
                this.current = data;
                // Backend returns likes/saves/comments counts and per-user flags on the post payload
                this.current.likes_count = this.current.likes_count || 0;
                this.current.saves_count = this.current.saves_count || 0;
                this.current.comments_count = this.current.comments_count || 0;
                this.current._liked = !!this.current.liked_by_user;
                this.current._saved = !!this.current.saved_by_user;
                await Alpine.store('comments').load(id);
            } catch (err) { console.error('Error getting post', err); }
        },
        async like(postId) {
            try {
                const token = Alpine.store('auth').token;
                await fetch(API_URL + '/api/likes', {
                    method: 'POST',
                    headers: Object.assign({'Content-Type': 'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}),
                    body: JSON.stringify({ post_id: postId })
                });
                // optimistic UI update
                const post = this.items.find(p => (p._id === postId || p._id == postId));
                if (post) { post._liked = true; post.likes_count = (post.likes_count || 0) + 1; }
                if (this.current && (this.current._id === postId || this.current._id == postId)) { this.current._liked = true; this.current.likes_count = (this.current.likes_count || 0) + 1 }
            } catch (err) { console.error('like error', err); }
        }
        ,
        async loadMore() {
            // guard against concurrent loads and end of data
            if (this.loading) return;
            if (!this.hasMore) return;
            const nextPage = (this.page || 0) + 1;
            await this.load(nextPage, 20, true);
        }
    })

    // Comments store
    Alpine.store('comments', {
        items: [],
        form: { text: '' },
        async load(postId) {
            try {
                const res = await fetch(API_URL + `/api/comments?post_id=${postId}`);
                const data = await res.json();
                this.items = (data || []).map(p => {
                    p.profile_pic = resolveImage(p.profile_pic || p.image_url || p.image);
                    // normalize populated user field to `user` for templates that expect `c.user`
                    if (p.user_id) {
                        p.user = p.user_id;
                        if (p.user && p.user.profile_pic) p.user.profile_pic = resolveImage(p.user.profile_pic);
                    }
                    return p;
                });
            } catch (err) { console.error('load comments', err); }
        },
        async add(postId) {
            try {
                const token = Alpine.store('auth').token;
                const res = await fetch(API_URL + '/api/comments', {
                    method: 'POST',
                    headers: Object.assign({'Content-Type': 'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}),
                    body: JSON.stringify({ post_id: postId, text: this.form.text })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Comment failed');
                // normalize returned comment: map user_id => user and resolve profile pic
                if (data.user_id) {
                    data.user = data.user_id;
                    if (data.user.profile_pic) data.user.profile_pic = resolveImage(data.user.profile_pic);
                }
                this.items.push(data);
                this.form.text = '';
                // update posts counts in UI
                const postsStore = Alpine.store('posts');
                const post = postsStore.items.find(p => (p._id === postId || String(p._id) === String(postId)));
                if (post) post.comments_count = (post.comments_count || 0) + 1;
                if (postsStore.current && (postsStore.current._id === postId || String(postsStore.current._id) === String(postId))) postsStore.current.comments_count = (postsStore.current.comments_count || 0) + 1;
            } catch (err) { alert(err.message || 'Error adding comment'); }
        }
    })

    // Profile store
    Alpine.store('profile', {
        posts: [],
        async load(userId) {
            try {
                const res = await fetch(API_URL + `/api/posts?user_id=${userId}`);
                const data = await res.json();
                this.posts = (data || []).map(p => {
                    p.image_url = resolveImage(p.image_url || p.image);
                    return p;
                });
            } catch (err) { console.error('profile posts', err); }
        }
    })

    // Species / Explore store
    Alpine.store('species', {
        items: [],
        current: null,
        async search(q) {
            try {
                const res = await fetch(API_URL + `/api/species?search=${encodeURIComponent(q)}`);
                const data = await res.json();
                this.items = data;
            } catch (err) { console.error('species search', err); }
        }
        ,
        async loadAll() {
            try {
                const res = await fetch(API_URL + '/api/species');
                const data = await res.json();
                this.items = (data || []).map(s => {
                    if (s.profile_pic || s.image_url || s.image) s.profile_pic = resolveImage(s.profile_pic || s.image_url || s.image);
                    return s;
                });
            } catch (err) { console.error('species loadAll', err); }
        }
        ,
        async getById(id) {
            try {
                const res = await fetch(API_URL + `/api/species/${id}`);
                const data = await res.json();
                if (data) data.profile_pic = resolveImage(data.profile_pic || data.image_url || data.image);
                this.current = data;
            } catch (err) { console.error('species getById', err); }
        }
    })

    // Plant Profiles store
    Alpine.store('plantProfiles', {
        items: [],
        showCreate: false,
        form: { nickname: '', species: '', notes: '', file: null },
        current: null,
        handleFile(e) {
            this.form.file = e.target.files[0];
        },
        async load() {
            try {
                // allow loading profiles for a specific user
                const userId = arguments[0];
                const url = userId ? (API_URL + `/api/plant-profiles/user/${userId}`) : (API_URL + '/api/plant-profiles');
                const res = await fetch(url);
                const data = await res.json();
                this.items = (data || []).map(p => {
                    p.profile_pic = resolveImage(p.profile_pic || p.image_url || p.image);
                    if (p.user_id && p.user_id.profile_pic) p.user_id.profile_pic = resolveImage(p.user_id.profile_pic);
                    return p;
                });
            } catch (err) { console.error('plantProfiles load', err); }
        },
        async create() {
            try {
                let imageUrl = '';
                const token = Alpine.store('auth').token;
                const currentUser = Alpine.store('auth').user;
                if (!currentUser) {
                    alert('Debes iniciar sesión para crear un Plant Profile.');
                    return;
                }
                if (this.form.file) {
                    const fd = new FormData();
                    fd.append('image', this.form.file);
                    const up = await fetch(API_URL + '/api/upload/single', {
                        method: 'POST',
                        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
                        body: fd
                    });
                    const upData = await up.json();
                    if (!up.ok) throw new Error(upData.error || 'Upload failed');
                    imageUrl = upData.imageUrl || upData.image_url || `/uploads/${upData.filename}`;
                }
                const body = {
                    nickname: this.form.nickname || this.form.name,
                    species: this.form.species,
                    notes: this.form.notes,
                    profile_pic: imageUrl,
                    user_id: currentUser._id
                };
                const res = await fetch(API_URL + '/api/plant-profiles', {
                    method: 'POST',
                    headers: Object.assign({'Content-Type': 'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}),
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Create plant profile failed');
                if (data) {
                    data.profile_pic = resolveImage(data.profile_pic || data.image_url || data.image);
                    if (data.user_id && data.user_id.profile_pic) data.user_id.profile_pic = resolveImage(data.user_id.profile_pic);
                }
                this.items.unshift(data);
                this.form = { nickname: '', species: '', notes: '', file: null };
                this.showCreate = false;
            } catch (err) { alert(err.message || 'Error creating plant profile'); }
        },
        async getById(id) {
            try {
                const res = await fetch(API_URL + `/api/plant-profiles/${id}`);
                const data = await res.json();
                if (data) data.profile_pic = resolveImage(data.profile_pic || data.image_url || data.image);
                this.current = data;
            } catch (err) { console.error('plantProfiles getById', err); }
        },
        async remove(id) {
            try {
                const token = Alpine.store('auth').token;
                const res = await fetch(API_URL + `/api/plant-profiles/${id}`, {
                    method: 'DELETE',
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
                });
                if (res.ok) {
                    this.items = this.items.filter(p => p._id !== id);
                }
            } catch (err) { console.error('plantProfiles remove', err); }
        }
    })

    // Saves store
    Alpine.store('saves', {
        items: [],
        async toggleSave(postId) {
            try {
                const token = Alpine.store('auth').token;
                const existing = this.items.find(s => {
                    const pid = s.post_id && (s.post_id._id || s.post_id);
                    const p2 = s.post && (s.post._id || s.post);
                    return (pid && (String(pid) === String(postId))) || (p2 && (String(p2) === String(postId)));
                });
                    if (existing) {
                    await fetch(API_URL + `/api/saves/${existing._id}`, { method: 'DELETE', headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                    // remove locally
                    this.items = this.items.filter(s => {
                        const pid = s.post_id && (s.post_id._id || s.post_id);
                        const p2 = s.post && (s.post._id || s.post);
                        return !((pid && (String(pid) === String(postId))) || (p2 && (String(p2) === String(postId))));
                    });
                    // update posts UI flag and counter
                    const postsStore = Alpine.store('posts');
                    const post = postsStore.items.find(p => (p._id === postId || String(p._id) === String(postId)));
                    if (post) { post._saved = false; post.saves_count = Math.max(0, (post.saves_count || 1) - 1); }
                    if (postsStore.current && (postsStore.current._id === postId || String(postsStore.current._id) === String(postId))) postsStore.current.saves_count = Math.max(0, (postsStore.current.saves_count || 1) - 1);
                } else {
                    const res = await fetch(API_URL + '/api/saves', {
                        method: 'POST',
                        headers: Object.assign({'Content-Type':'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}),
                        body: JSON.stringify({ post_id: postId })
                    });
                    const data = await res.json();
                    this.items.push(data);
                    const postsStore = Alpine.store('posts');
                    const post = postsStore.items.find(p => (p._id === postId || String(p._id) === String(postId)));
                    if (post) { post._saved = true; post.saves_count = (post.saves_count || 0) + 1 }
                    if (postsStore.current && (postsStore.current._id === postId || String(postsStore.current._id) === String(postId))) postsStore.current.saves_count = (postsStore.current.saves_count || 0) + 1;
                }
            } catch (err) { console.error('saves error', err); }
        },
        async load() {
            try {
                const token = Alpine.store('auth').token;
                const user = Alpine.store('auth').user;
                if (!token || !user || !user._id) {
                    this.items = [];
                    return;
                }
                const res = await fetch(API_URL + `/api/saves/user/${user._id}`, { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                const data = await res.json();
                this.items = (data || []).map(s => {
                    if (s.post_id) s.post_id.image_url = resolveImage(s.post_id.image_url || s.post_id.image);
                    if (s.post) s.post.image_url = resolveImage(s.post.image_url || s.post.image);
                    return s;
                });
            } catch (err) { console.error('load saves', err); }
        }
    })

    // Notifications store
    Alpine.store('notifications', {
        items: [],
        async load() {
            try {
                const token = Alpine.store('auth').token;
                const res = await fetch(API_URL + '/api/notifications', { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                const data = await res.json();
                this.items = data;
            } catch (err) { console.error('notifications load', err); }
        }
        ,
        async markRead(id) {
            try {
                const token = Alpine.store('auth').token;
                const res = await fetch(API_URL + `/api/notifications/${id}`, {
                    method: 'PUT',
                    headers: Object.assign({'Content-Type':'application/json'}, token ? { 'Authorization': 'Bearer ' + token } : {}),
                    body: JSON.stringify({ read: true })
                });
                if (res.ok) {
                    // update local list
                    this.items = this.items.map(n => n._id === id ? Object.assign({}, n, { read: true }) : n);
                }
            } catch (err) { console.error('markRead', err); }
        },
        async remove(id) {
            try {
                const token = Alpine.store('auth').token;
                const res = await fetch(API_URL + `/api/notifications/${id}`, {
                    method: 'DELETE',
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
                });
                if (res.ok) {
                    this.items = this.items.filter(n => n._id !== id);
                }
            } catch (err) { console.error('notifications remove', err); }
        }
    })

})
