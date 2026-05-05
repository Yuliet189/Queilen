/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  User, 
  Search, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Upload, 
  FileText, 
  Eye, 
  CheckCircle2, 
  Menu as MenuIcon,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PRODUCTS } from './constants';
import { Product, CartItem, Customer } from './types';
import { toast, Toaster } from 'sonner';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string>('inicio');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [cedulaInput, setCedulaInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});
  const [radicado, setRadicado] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; url: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; url: string } | null>(null);
  const [hasMadePurchase, setHasMadePurchase] = useState(false);

  // Mock "database" of customers
  const [mockCustomers, setMockCustomers] = useState<Customer[]>([
    { id: '12345', firstName: 'Juan', lastName: 'Perez', email: 'juan@example.com', phone: '3001234567' }
  ]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'inicio' || activeCategory === 'ofertas') return PRODUCTS;
    return PRODUCTS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} agregado`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const handleSearchCustomer = async () => {
    if (!cedulaInput) return;
    
    const loadingToast = toast.loading("Consultando base de datos...", {
      description: "Buscando información de identificación..."
    });

    try {
      const response = await fetch('/api/customer-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cedula: cedulaInput }),
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        const data = await response.json();
        
        // n8n returns an array or an object. Let's assume it's data about the user if found.
        // We check if we got a valid object with at least an email or name
        if (data && (data.email || data.firstName || data.nombre)) {
          const foundCustomer: Customer = {
            id: data.id || cedulaInput,
            firstName: data.firstName || data.nombre || '',
            lastName: data.lastName || data.apellido || '',
            email: data.email || '',
            phone: data.phone || data.telefono || '',
          };

          setCustomer(foundCustomer);
          setIsRegistering(false);
          toast.success("¡Datos encontrados!", {
            description: "Sus datos se encuentran registrados en nuestro sistema.",
          });
          // Close dialog after success
          setTimeout(() => setIsCustomerDialogOpen(false), 1500);
        } else {
          setIsRegistering(true);
          setNewCustomer({ id: cedulaInput, firstName: '', lastName: '', email: '', phone: '' });
          toast.info("Usuario no encontrado", {
            description: "Sus datos no se encuentran registrados y debe diligenciar toda la información.",
          });
        }
      } else {
        throw new Error("Respuesta no exitosa del servidor");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error connecting to n8n:", error);
      
      // Fallback a búsqueda local si n8n falla
      const localFound = mockCustomers.find(c => c.id === cedulaInput);
      if (localFound) {
        setCustomer(localFound);
        setIsRegistering(false);
        toast.success("¡Datos encontrados (Local)!", {
          description: "Sus datos se encuentran registrados en nuestra base local.",
        });
        setTimeout(() => setIsCustomerDialogOpen(false), 1500);
      } else {
        setIsRegistering(true);
        setNewCustomer({ id: cedulaInput, firstName: '', lastName: '', email: '', phone: '' });
        toast.info("Usuario no registrado", {
          description: "No pudimos conectar con el servicio externo, pero puedes registrarte manualmente.",
        });
      }
    }
  };

  const handleRegister = () => {
    if (newCustomer.id && newCustomer.firstName && newCustomer.lastName && newCustomer.email) {
      const customerToSave = newCustomer as Customer;
      setMockCustomers(prev => [...prev, customerToSave]);
      setCustomer(customerToSave);
      setIsRegistering(false);
      toast.success("Registro exitoso");
    } else {
      toast.error("Completa todos los campos obligatorios");
    }
  };

  const handleComprarAhora = () => {
    if (!customer) {
      document.getElementById('id-input')?.focus();
      setIsCustomerDialogOpen(true);
      toast.info("Por favor identifica tu cuenta primero para comprar");
    } else {
      const newRadicado = `LMV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      setRadicado(newRadicado);
      setHasMadePurchase(true);
      setCart([]); // Clear cart to simulate checkout
      toast.success("¡Compra realizada con éxito! Se ha generado tu radicado de seguimiento.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        name: (file as File).name,
        type: (file as File).type,
        url: URL.createObjectURL(file as File)
      }));
      setAttachedFiles(prev => [...prev, ...filesArray]);
      
      // Auto-generate radicado on upload if not already present
      if (!radicado) {
        const newRadicado = `LMV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        setRadicado(newRadicado);
      }
      
      toast.success("Archivo adjuntado correctamente y radicado generado");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-right" richColors />
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 
              className="text-3xl font-display uppercase tracking-widest cursor-pointer text-primary leading-none"
              onClick={() => setActiveCategory('inicio')}
            >
              LA MODA ES <span className="text-zinc-900 border-b-4 border-accent">VIDA</span>
            </h1>
            <nav className="hidden lg:flex items-center gap-8">
              {['inicio', 'mujer', 'hombre', 'accesorios', 'ofertas'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all relative py-2 ${activeCategory === cat ? 'text-primary' : 'text-zinc-400 hover:text-zinc-900'}`}
                >
                  {cat}
                  {activeCategory === cat && (
                    <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-zinc-50 border rounded-full px-4 h-10 w-64">
              <Search className="w-4 h-4 text-zinc-400 mr-2" />
              <input placeholder="BUSCAR..." className="bg-transparent border-none outline-none text-[10px] font-bold uppercase w-full" />
            </div>

            <Sheet>
              <SheetTrigger className="relative p-2 group">
                <ShoppingBag className="w-6 h-6 text-zinc-900 group-hover:text-primary transition-colors" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-bounce ring-2 ring-white">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent className="w-[450px] bg-white flex flex-col p-8">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-4xl font-display uppercase tracking-tighter">TU CESTA</SheetTitle>
                  <SheetDescription className="uppercase-bold text-[9px] text-zinc-400">
                    REVISA TU SELECCIÓN ANTES DE PAGAR
                  </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-8">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-6 items-center group">
                        <div className="w-24 h-32 bg-zinc-100 overflow-hidden relative border border-zinc-50">
                          <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <h5 className="text-sm font-black uppercase tracking-tight">{item.name}</h5>
                            <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-zinc-300 hover:text-primary">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 border rounded-full px-3 py-1 bg-zinc-50">
                              <button onClick={() => updateQuantity(item.id, -1)} className="text-zinc-500 hover:text-primary"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="text-zinc-500 hover:text-primary"><Plus className="w-3 h-3" /></button>
                            </div>
                            <p className="text-lg font-display text-zinc-900">${(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="py-20 text-center space-y-6">
                        <ShoppingBag className="w-16 h-16 text-zinc-100 mx-auto" />
                        <p className="uppercase-bold text-xs text-zinc-400 italic">TU BOLSA DE COMPRAS ESTÁ VACÍA</p>
                        <Button variant="outline" className="rounded-none uppercase-bold h-12" onClick={() => setActiveCategory('mujer')}>EXPLORAR TIENDA</Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {cart.length > 0 && (
                  <div className="pt-8 border-t space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="uppercase-bold text-[10px] text-zinc-400 italic">TOTAL ESTIMADO</span>
                      <span className="text-4xl font-display text-primary tracking-tighter">${total.toLocaleString()}</span>
                    </div>
                    <Button 
                      className="w-full h-16 bg-zinc-900 hover:bg-primary text-white text-xs font-black uppercase tracking-[0.4em] rounded-none shadow-2xl transition-all"
                      onClick={handleComprarAhora}
                    >
                      FINALIZAR COMPRA
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <button 
              className={`p-2 transition-colors ${customer ? 'text-primary' : 'text-zinc-900'}`}
              onClick={() => setIsCustomerDialogOpen(true)}
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        {activeCategory === 'inicio' && (
          <section className="relative h-[80vh] bg-zinc-900 overflow-hidden flex items-center">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1920" 
                alt="Banner" 
                className="w-full h-full object-cover opacity-60 scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 w-full relative z-10 text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block px-4 py-1 bg-accent text-zinc-900 text-[10px] font-black uppercase tracking-[0.5em] mb-4"
              >
                NUEVA TEMPORADA 2026
              </motion.div>
              <h2 className="text-7xl md:text-[10rem] font-display text-white italic leading-[0.8] tracking-tighter uppercase">
                ESTILO <br /> <span className="text-secondary tracking-widest font-normal">SIN LÍMITES</span>
              </h2>
              <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
                <Button 
                  size="lg" 
                  className="h-16 px-12 bg-white text-zinc-900 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-white rounded-none transition-all shadow-2xl"
                  onClick={() => setActiveCategory('mujer')}
                >
                  VER COLECCIÓN
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-16 px-12 border-white/50 text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white/20 backdrop-blur-md rounded-none transition-all"
                >
                  VER LOOKBOOK
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* PRODUCT GRID SECTION */}
        <section className="max-w-7xl mx-auto px-4 py-24">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 underline-offset-8">
            <div className="space-y-4">
              <h3 className="text-5xl md:text-7xl font-display uppercase italic tracking-tighter leading-none">
                {activeCategory} <span className="text-zinc-100 not-italic block md:inline text-8xl md:text-9xl -mt-4 md:mt-0 md:-ml-4 absolute -z-10 opacity-50">{activeCategory}</span>
              </h3>
              <p className="uppercase-bold text-[10px] text-zinc-400">DESCUBRE LAS TENDENCIAS QUE ESTÁN DEFINIENDO EL AÑO</p>
            </div>
            
            <div className="flex bg-zinc-50 border rounded-none p-1">
              {['mujer', 'hombre', 'accesorios', 'ofertas'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-900'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <div className="aspect-[3/4] bg-zinc-100 mb-6 relative overflow-hidden ring-1 ring-zinc-50 shadow-sm border border-zinc-100">
                    <img 
                      src={product.image} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      referrerPolicy="no-referrer"
                    />
                    {product.tag && (
                      <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest italic shadow-xl">
                        {product.tag}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
                      <Button 
                        className="w-full bg-zinc-900 text-white h-12 rounded-none text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-colors h-14"
                        onClick={() => addToCart(product)}
                      >
                        AGREGAR AL CARRITO
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="uppercase-bold text-[9px] text-zinc-400 italic mb-2">{product.category}</p>
                    <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 group-hover:text-primary transition-colors leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-xl font-display text-zinc-900 mt-2">${product.price.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* INTERACTIVE TOOLS SECTION */}
        <section className="bg-zinc-50 py-24">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-6xl font-display uppercase tracking-tighter italic leading-[0.8] mb-4">SERVICIO AL <br /> <span className="text-primary not-italic tracking-normal">EDITOR</span></h2>
                <p className="text-zinc-500 uppercase-bold text-[10px] max-w-sm">GESTIONA TUS PEDIDOS Y SEGUIMIENTOS DESDE UN SOLO LUGAR</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-primary h-full flex flex-col justify-between">
                  <div>
                    <h4 className="uppercase-bold text-xs mb-4">SEGUIMIENTO DE TRÁMITE</h4>
                    <p className="text-[10px] text-zinc-400 uppercase italic mb-6">TU CÓDIGO DE SEGUIMIENTO SE GENERARÁ AUTOMÁTICAMENTE AL COMPRAR O ADJUNTAR ARCHIVOS.</p>
                  </div>
                  
                  {radicado ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-primary/5 border border-dashed border-primary/30 text-center space-y-2"
                    >
                      <p className="uppercase-bold text-[9px] text-primary">CÓDIGO ACTIVO</p>
                      <p className="text-2xl font-mono font-black text-zinc-900 tracking-widest">{radicado}</p>
                    </motion.div>
                  ) : (
                    <div className="p-6 bg-zinc-50 border border-zinc-100 text-center opacity-50">
                      <p className="uppercase-bold text-[9px] text-zinc-400 italic">SIN RADICADO ACTIVO</p>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-white shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-secondary">
                  <h4 className="uppercase-bold text-xs mb-4">SUBIR ARCHIVOS</h4>
                  <p className="text-[10px] text-zinc-400 uppercase italic mb-6">ADJUNTA COMPROBANTES O DOCUMENTOS RELEVANTES</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-zinc-200 rounded-none h-12 uppercase-bold text-[10px] hover:bg-zinc-50"
                    onClick={() => document.getElementById('main-upload')?.click()}
                  >
                    SUBIR ARCHIVOS <Upload className="w-4 h-4 ml-2" />
                  </Button>
                  <input type="file" id="main-upload" className="hidden" multiple onChange={handleFileUpload} />
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {attachedFiles.map((file, i) => (
                      <button 
                        key={i} 
                        className={`w-10 h-10 border flex items-center justify-center transition-all ${selectedFile?.name === file.name ? 'border-primary bg-primary/5 shadow-inner' : 'border-zinc-200 hover:border-primary'}`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <FileText className="w-4 h-4 text-zinc-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900 p-8 text-white min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                  <h4 className="uppercase-bold text-[10px] tracking-[0.4em] text-zinc-500">VISOR DIGITAL</h4>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center bg-black/40 rounded border border-white/5 p-4">
                  {selectedFile ? (
                    <div className="w-full h-full flex flex-col gap-4">
                      {selectedFile.type.startsWith('image/') ? (
                        <div className="flex-1 relative overflow-hidden rounded">
                          <img src={selectedFile.url} alt="" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                           <FileText className="w-16 h-16 text-zinc-700" />
                           <p className="uppercase-bold text-[10px] text-zinc-500 italic">VISTA PREVIA NO SOPORTADA</p>
                        </div>
                      )}
                      <p className="text-[10px] text-zinc-400 font-mono tracking-widest text-center truncate">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 opacity-20 group">
                      <Eye className="w-16 h-16 mx-auto transition-transform group-hover:scale-110" />
                      <p className="uppercase-bold text-xs italic tracking-[0.3em]">SELECCIONA UN DOCUMENTO PARA VISUALIZAR</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLIENT ACCESS MODAL-LIKE DRAWER */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="sm:max-w-xl bg-white p-12 rounded-none border-none shadow-2xl">
            <DialogHeader className="mb-10 text-center">
              <DialogTitle className="text-5xl font-display uppercase italic tracking-tighter mb-2">MI CUENTA</DialogTitle>
              <DialogDescription className="uppercase-bold text-[10px] text-zinc-400">GESTIONA TUS PEDIDOS Y REGISTRA TU IDENTIDAD</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-10">
              {!customer && !isRegistering && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="uppercase-bold text-[10px] text-zinc-400">IDENTIFICACIÓN CIUDADANA (CÉDULA)</label>
                    <div className="flex gap-4">
                      <Input 
                        id="id-input-modal"
                        placeholder="EJ: 123456789" 
                        className="h-14 bg-zinc-50 border-none px-6 text-sm font-black tracking-widest rounded-none shadow-inner"
                        value={cedulaInput}
                        onChange={(e) => setCedulaInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                      />
                      <Button className="h-14 px-10 bg-zinc-900 text-white rounded-none uppercase-bold text-[10px] hover:bg-primary shadow-xl" onClick={handleSearchCustomer}>
                        BUSCAR
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isRegistering && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="uppercase-bold text-[9px] text-zinc-400">NÚMERO DE CÉDULA</label>
                      <Input 
                        value={newCustomer.id || ''} 
                        className="h-12 bg-zinc-50 border-none rounded-none font-bold" 
                        onChange={e => setNewCustomer(prev => ({...prev, id: e.target.value}))} 
                        placeholder="Ingresa tu identificación"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="uppercase-bold text-[9px] text-zinc-400">NOMBRE</label>
                      <Input className="h-12 bg-zinc-50 border-none rounded-none" onChange={e => setNewCustomer(prev => ({...prev, firstName: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <label className="uppercase-bold text-[9px] text-zinc-400">APELLIDOS</label>
                      <Input className="h-12 bg-zinc-50 border-none rounded-none" onChange={e => setNewCustomer(prev => ({...prev, lastName: e.target.value}))} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="uppercase-bold text-[9px] text-zinc-400">EMAIL</label>
                      <Input className="h-12 bg-zinc-50 border-none rounded-none" onChange={e => setNewCustomer(prev => ({...prev, email: e.target.value}))} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="uppercase-bold text-[9px] text-zinc-400">TELÉFONO</label>
                      <Input className="h-12 bg-zinc-50 border-none rounded-none" onChange={e => setNewCustomer(prev => ({...prev, phone: e.target.value}))} />
                    </div>
                  </div>
                  <Button className="w-full h-14 bg-primary text-white rounded-none uppercase-bold text-[10px] shadow-2xl hover:bg-zinc-900" onClick={handleRegister}>
                    CREAR CUENTA
                  </Button>
                  <button className="w-full text-center uppercase-bold text-[9px] text-zinc-300 hover:text-zinc-900" onClick={() => setIsRegistering(false)}>REGRESAR</button>
                </motion.div>
              )}

              {customer && (
                <div className="p-8 bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-display italic text-primary">
                      {customer.firstName[0]}
                    </div>
                    <div className="space-y-1">
                       <p className="uppercase-bold text-[10px] text-zinc-400 italic">BIENVENIDO DE NUEVO</p>
                       <h4 className="text-3xl font-display uppercase tracking-tighter">{customer.firstName} {customer.lastName}</h4>
                       <p className="text-[10px] font-black tracking-widest text-zinc-500">{customer.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="uppercase-bold text-xs text-primary" onClick={() => setCustomer(null)}>SALIR</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 divide-y divide-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 pb-20">
            <div className="space-y-8">
              <h1 className="text-3xl font-display uppercase tracking-widest text-primary leading-none">LA MODA ES <br /> <span className="text-white border-b-4 border-accent">VIDA</span></h1>
              <p className="text-zinc-500 uppercase-bold text-[9px] leading-6 italic">REDEFINIENDO LA MODA URBANA Y JUVENIL DESDE EL AÑO 2024. CALIDAD, ESTILO Y ACTITUD EN CADA UNA DE NUESTRAS PIEZAS EXCLUSIVAS.</p>
              <div className="flex gap-4">
                {['IG', 'FB', 'TK', 'YT'].map(s => (
                  <button key={s} className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center text-[11px] font-black hover:bg-primary hover:border-primary transition-all shadow-xl">{s}</button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h5 className="uppercase-bold text-xs text-accent">CATEGORÍAS</h5>
              <ul className="space-y-4 uppercase-bold text-[10px] text-zinc-500 italic">
                {['MUJER', 'HOMBRE', 'ACCESORIOS', 'OFERTAS'].map(c => (
                  <li key={c}><button onClick={() => setActiveCategory(c.toLowerCase())} className="hover:text-white transition-colors">→ {c}</button></li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <h5 className="uppercase-bold text-xs text-accent">NOSOTROS</h5>
              <ul className="space-y-4 uppercase-bold text-[10px] text-zinc-500 italic">
                <li>→ QUIÉNES SOMOS</li>
                <li>→ NUESTRAS TIENDAS</li>
                <li>→ SOSTENIBILIDAD</li>
                <li>→ CONTACTO</li>
              </ul>
            </div>

            <div className="space-y-8">
              <h5 className="uppercase-bold text-xs text-accent">LEGAL</h5>
              <ul className="space-y-4 uppercase-bold text-[10px] text-zinc-500 italic">
                <li>→ TÉRMINOS Y CONDICIONES</li>
                <li>→ POLÍTICA DE PRIVACIDAD</li>
                <li>→ CAMBIOS Y DEVOLUCIONES</li>
                <li>→ TRABAJA CON NOSOTROS</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6 uppercase-bold text-[9px] text-zinc-700 tracking-[0.4em]">
            <p>© 2026 LA MODA ES VIDA — TODOS LOS DERECHOS RESERVADOS — BOGOTÁ, COLOMBIA</p>
            <div className="flex items-center gap-8">
               <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> PAGO SEGURO SSL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

