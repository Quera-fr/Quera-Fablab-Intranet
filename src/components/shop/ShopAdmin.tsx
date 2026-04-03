import { Plus, UploadIcon } from "lucide-react";

interface ShopAdminProps {
	canManageShop: boolean;
	showForm: boolean;
	setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
	uploading: boolean;
	form: {
		title: string;
		description: string;
		image_url: string;
		points: number;
		imageFile: File | null;
	};
	setForm: React.Dispatch<
		React.SetStateAction<{
			title: string;
			description: string;
			image_url: string;
			points: number;
			imageFile: File | null;
		}>
	>;
	onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function ShopAdmin({
	canManageShop,
	showForm,
	setShowForm,
	uploading,
	form,
	setForm,
	onSubmit,
}: ShopAdminProps) {
	if (!canManageShop) return null;

	return (
		<>
			<button
				className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-black text-[10px] uppercase tracking-widest"
				onClick={() => setShowForm((v) => !v)}
			>
				<Plus size={14} />
				Nouvel article
			</button>

			{showForm && (
				<div
					className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
					onClick={() => setShowForm(false)}
				>
					<form
						onSubmit={onSubmit}
						className="flex flex-col gap-4 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white mb-2">
							Nouvel article
						</h3>

						<div>
							<label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
								Titre de l'article
							</label>
							<input
								className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
								placeholder="Titre"
								value={form.title}
								onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
								required
							/>
						</div>

						<div>
							<label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
								Description
							</label>
							<textarea
								className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
								placeholder="Description"
								rows={3}
								value={form.description}
								onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
							/>
						</div>

						<div>
							<label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
								Image (URL ou upload)
							</label>
							<input
								className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white mb-2"
								placeholder="URL de l'image"
								value={form.image_url}
								onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
							/>
							<label
								htmlFor="file-upload"
								className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
							>
								<UploadIcon className="w-6 h-6 text-zinc-400 mb-1" />
								<span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
									{form.imageFile ? form.imageFile.name : "Cliquer pour uploader"}
								</span>
								<input
									id="file-upload"
									type="file"
									className="hidden"
									accept="image/*"
									onChange={(e) =>
										setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))
									}
								/>
							</label>
						</div>

						<div>
							<label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
								Cout en pts Quera
							</label>
							<input
								className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
								type="number"
								min={1}
								placeholder="Points"
								value={form.points}
								onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
								required
							/>
						</div>

						<div className="flex gap-3 mt-2">
							<button
								type="button"
								className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
								onClick={() => setShowForm(false)}
							>
								Annuler
							</button>
							<button
								type="submit"
								disabled={uploading}
								className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{uploading ? "Envoi..." : "Creer"}
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
}
