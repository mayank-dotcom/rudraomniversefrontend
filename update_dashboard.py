import os

filepath = "app/pages/Dashboard.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF for uniform matching
original_crlf = "\r\n" in content
content = content.replace("\r\n", "\n")

replacements = []

# 1. Lucide React Icons Import
target_1 = """    Info, Lock, Scale, Share2, GraduationCap, Play
} from 'lucide-react';"""

replacement_1 = """    Info, Lock, Scale, Share2, GraduationCap, Play, Code2, Smartphone
} from 'lucide-react';"""

replacements.append((target_1, replacement_1))

# 2. Header Title Display
target_2 = """                                                    {editingSiteSetting.key === 'about_us' ? 'About Us' :
                                                         editingSiteSetting.key === 'privacy_policy' ? 'Privacy Policy' :
                                                             editingSiteSetting.key === 'terms_conditions' ? 'Terms of Service' :
                                                                 editingSiteSetting.key === 'contact_info' ? 'Contact Us' : 
                                                                     editingSiteSetting.key === 'social_media_links' ? 'Social Media Links' : 
                                                                         editingSiteSetting.key === 'schools_page' ? 'Schools Page' : 
                                                                             editingSiteSetting.key === 'b2b_page' ? 'B2B Page' : 
                                                                                 editingSiteSetting.key === 'home_page' ? 'Home Page Video' : editingSiteSetting.key}"""

replacement_2 = """                                                    {editingSiteSetting.key === 'about_us' ? 'About Us' :
                                                         editingSiteSetting.key === 'privacy_policy' ? 'Privacy Policy' :
                                                             editingSiteSetting.key === 'terms_conditions' ? 'Terms of Service' :
                                                                 editingSiteSetting.key === 'contact_info' ? 'Contact Us' : 
                                                                     editingSiteSetting.key === 'social_media_links' ? 'Social Media Links' : 
                                                                         editingSiteSetting.key === 'schools_page' ? 'Schools Page' : 
                                                                             editingSiteSetting.key === 'b2b_page' ? 'B2B Page' : 
                                                                                 editingSiteSetting.key === 'home_page' ? 'Home Page Video' : 
                                                                                     editingSiteSetting.key === 'plugin_page' ? 'Plugin Page' : 
                                                                                         editingSiteSetting.key === 'mobile_page' ? 'Mobile App Page' : editingSiteSetting.key}"""

replacements.append((target_2, replacement_2))

# 3. Forms Editor Block
target_3 = """                                            {(editingSiteSetting.key === 'privacy_policy' || editingSiteSetting.key === 'terms_conditions') && ("""

replacement_3 = """                                            {editingSiteSetting.key === 'plugin_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button Text</label>
                                                        <input
                                                            value={siteFormData?.buttonText || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonText: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. VS Code Marketplace"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button Link URL</label>
                                                        <input
                                                            value={siteFormData?.buttonUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. https://marketplace.visualstudio.com/items?itemName=..."
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'mobile_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button Text</label>
                                                        <input
                                                            value={siteFormData?.buttonText || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonText: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. Download for Android"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button Link URL</label>
                                                        <input
                                                            value={siteFormData?.buttonUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. https://play.google.com/store/apps/details?id=..."
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(editingSiteSetting.key === 'privacy_policy' || editingSiteSetting.key === 'terms_conditions') && ("""

replacements.append((target_3, replacement_3))

# 4. Save Changes Bypass Handler
target_4 = """                                                             if (editingSiteSetting.key === 'home_page') {
                                                                 try {
                                                                     localStorage.setItem("rudranex_home_page", editingSiteSetting.value);
                                                                     toast.success("Home page video updated successfully (Local Storage)");
                                                                     fetchData();
                                                                 } catch (e) {
                                                                     console.error("Local storage save error:", e);
                                                                     toast.error("Failed to save to local storage");
                                                                 }
                                                                 return;
                                                             }"""

replacement_4 = """                                                             if (editingSiteSetting.key === 'home_page') {
                                                                 try {
                                                                     localStorage.setItem("rudranex_home_page", editingSiteSetting.value);
                                                                     toast.success("Home page video updated successfully (Local Storage)");
                                                                     fetchData();
                                                                 } catch (e) {
                                                                     console.error("Local storage save error:", e);
                                                                     toast.error("Failed to save to local storage");
                                                                 }
                                                                 return;
                                                             }
                                                             if (editingSiteSetting.key === 'plugin_page') {
                                                                 try {
                                                                     localStorage.setItem("rudranex_plugin_page", editingSiteSetting.value);
                                                                     toast.success("Plugin page updated successfully (Local Storage)");
                                                                     fetchData();
                                                                 } catch (e) {
                                                                     console.error("Local storage save error:", e);
                                                                     toast.error("Failed to save to local storage");
                                                                 }
                                                                 return;
                                                             }
                                                             if (editingSiteSetting.key === 'mobile_page') {
                                                                 try {
                                                                     localStorage.setItem("rudranex_mobile_page", editingSiteSetting.value);
                                                                     toast.success("Mobile app page updated successfully (Local Storage)");
                                                                     fetchData();
                                                                 } catch (e) {
                                                                     console.error("Local storage save error:", e);
                                                                     toast.error("Failed to save to local storage");
                                                                 }
                                                                 return;
                                                             }"""

replacements.append((target_4, replacement_4))

# 5. Sidebar Navigation Button List
target_5 = """                                {[
                                    { key: 'about_us', label: 'About Us', icon: Info },
                                    { key: 'privacy_policy', label: 'Privacy Policy', icon: Lock },
                                    { key: 'terms_conditions', label: 'Terms of Service', icon: Scale },
                                    { key: 'contact_info', label: 'Contact Us', icon: Mail },
                                    { key: 'social_media_links', label: 'Social Media Links', icon: Share2 },
                                    { key: 'schools_page', label: 'Schools Page', icon: GraduationCap },
                                    { key: 'b2b_page', label: 'B2B Page', icon: Briefcase },
                                    { key: 'home_page', label: 'Home Page Video', icon: Play },
                                ].map((page) => {"""

replacement_5 = """                                {[
                                    { key: 'about_us', label: 'About Us', icon: Info },
                                    { key: 'privacy_policy', label: 'Privacy Policy', icon: Lock },
                                    { key: 'terms_conditions', label: 'Terms of Service', icon: Scale },
                                    { key: 'contact_info', label: 'Contact Us', icon: Mail },
                                    { key: 'social_media_links', label: 'Social Media Links', icon: Share2 },
                                    { key: 'schools_page', label: 'Schools Page', icon: GraduationCap },
                                    { key: 'b2b_page', label: 'B2B Page', icon: Briefcase },
                                    { key: 'home_page', label: 'Home Page Video', icon: Play },
                                    { key: 'plugin_page', label: 'Plugin Page', icon: Code2 },
                                    { key: 'mobile_page', label: 'Mobile App Page', icon: Smartphone },
                                ].map((page) => {"""

replacements.append((target_5, replacement_5))

# 6. Sidebar Click Local Storage Getters
target_6 = """                                                } else if (page.key === 'home_page') {
                                                    try {
                                                        const stored = localStorage.getItem("rudranex_home_page");
                                                        if (stored) raw = stored;
                                                    } catch (e) {
                                                        console.error("Local storage error:", e);
                                                    }
                                                }"""

replacement_6 = """                                                } else if (page.key === 'home_page') {
                                                    try {
                                                        const stored = localStorage.getItem("rudranex_home_page");
                                                        if (stored) raw = stored;
                                                    } catch (e) {
                                                        console.error("Local storage error:", e);
                                                    }
                                                } else if (page.key === 'plugin_page') {
                                                    try {
                                                        const stored = localStorage.getItem("rudranex_plugin_page");
                                                        if (stored) raw = stored;
                                                    } catch (e) {
                                                        console.error("Local storage error:", e);
                                                    }
                                                } else if (page.key === 'mobile_page') {
                                                    try {
                                                        const stored = localStorage.getItem("rudranex_mobile_page");
                                                        if (stored) raw = stored;
                                                    } catch (e) {
                                                        console.error("Local storage error:", e);
                                                    }
                                                }"""

replacements.append((target_6, replacement_6))

# 7. Sidebar Click Parse Catch Block Defaults
target_7 = """                                                     } else if (page.key === 'home_page') {
                                                         const defaults = {
                                                             videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                                                         };
                                                         setSiteFormData(defaults);
                                                         setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                     } else {
                                                         setSiteFormData(null);
                                                         setEditingSiteSetting({ key: page.key, value: raw });
                                                     }
                                                 }"""

replacement_7 = """                                                     } else if (page.key === 'home_page') {
                                                         const defaults = {
                                                             videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                                                         };
                                                         setSiteFormData(defaults);
                                                         setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                     } else if (page.key === 'plugin_page') {
                                                         const defaults = {
                                                             title: "Rudranex AI Plugin",
                                                             description: "Bring Rudranex AI directly into your code editor. Get real-time AI assistance, smart debugging, and automated code reviews without leaving your workflow.",
                                                             buttonText: "VS Code Marketplace",
                                                             buttonUrl: "#"
                                                         };
                                                         setSiteFormData(defaults);
                                                         setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                     } else if (page.key === 'mobile_page') {
                                                         const defaults = {
                                                             title: "Rudranex AI Mobile",
                                                             description: "Take Rudranex AI wherever you go. Practice interviews, get code assistance, and learn on the move with our native mobile experience.",
                                                             buttonText: "Download for Android",
                                                             buttonUrl: "#"
                                                         };
                                                         setSiteFormData(defaults);
                                                         setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                     } else {
                                                         setSiteFormData(null);
                                                         setEditingSiteSetting({ key: page.key, value: raw });
                                                     }
                                                 }"""

replacements.append((target_7, replacement_7))

for idx, (target, replacement) in enumerate(replacements, 1):
    if target not in content:
        raise ValueError(f"Target pattern {idx} not found in the file content!")
    content = content.replace(target, replacement)

# Restore CRLFs if original file had them
if original_crlf:
    content = content.replace("\n", "\r\n")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully replaced all 7 blocks in Dashboard.tsx!")
