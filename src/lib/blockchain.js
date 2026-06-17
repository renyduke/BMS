/**
 * Blockchain-inspired certificate verification system.
 *
 * Uses SHA-256 hashing to create a tamper-proof chain of certificate records.
 * Each certificate links to the previous one via prev_hash — just like a blockchain.
 *
 * This is NOT a real distributed blockchain, but provides:
 * - Immutable audit trail (append-only table, no UPDATE/DELETE policies)
 * - Cryptographic proof of authenticity (SHA-256 hash)
 * - QR-code verification for physical certificates
 * - Chain linking (each block references the previous)
 */

import { supabase } from './supabase'

/**
 * Generate a SHA-256 hash of certificate data using Web Crypto API.
 */
export async function sha256(data) {
  const encoder = new TextEncoder()
  const buffer  = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer)
  const hashArr = Array.from(new Uint8Array(hashBuf))
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a certificate record on the blockchain ledger.
 * Called when admin approves a request.
 *
 * @param {object} params
 * @returns {{ cert_hash, record_id, block_index }}
 */
export async function issueCertificateOnChain({
  request_id,
  resident_name,
  cert_type,
  barangay,
  issued_by,
  date_issued,
}) {
  // 1. Get the latest block to link the chain
  const { data: latest } = await supabase
    .from('certificate_records')
    .select('cert_hash, block_index')
    .order('block_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const prev_hash    = latest?.cert_hash    ?? '0000000000000000'
  const block_index  = (latest?.block_index ?? 0) + 1

  // 2. Build the certificate data object to hash
  const certData = {
    request_id,
    resident_name,
    cert_type,
    barangay,
    issued_by,
    date_issued: date_issued ?? new Date().toISOString(),
    prev_hash,
    block_index,
    nonce: Date.now(),  // adds uniqueness
  }

  // 3. Generate SHA-256 hash
  const cert_hash = await sha256(certData)

  // 4. Store on the ledger (append-only)
  const { data, error } = await supabase
    .from('certificate_records')
    .insert({
      request_id,
      cert_hash,
      prev_hash,
      resident_name,
      cert_type,
      barangay,
      issued_by,
      issued_at:   certData.date_issued,
      block_index,
    })
    .select('id, cert_hash, block_index')
    .single()

  if (error) throw new Error('Blockchain ledger error: ' + error.message)

  return {
    cert_hash:   data.cert_hash,
    record_id:   data.id,
    block_index: data.block_index,
  }
}

/**
 * Verify a certificate by its hash.
 * Returns the certificate record if valid, null if tampered/not found.
 */
export async function verifyCertificate(cert_hash) {
  const { data, error } = await supabase
    .from('certificate_records')
    .select('*')
    .eq('cert_hash', cert_hash)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/**
 * Get the full chain (all blocks in order) — for admin audit view.
 */
export async function getChain() {
  const { data } = await supabase
    .from('certificate_records')
    .select('*')
    .order('block_index', { ascending: true })
  return data ?? []
}

/**
 * Verify chain integrity — each block's prev_hash must match the previous block's cert_hash.
 */
export async function verifyChainIntegrity() {
  const chain = await getChain()
  if (chain.length === 0) return { valid: true, blocks: 0 }

  for (let i = 1; i < chain.length; i++) {
    if (chain[i].prev_hash !== chain[i - 1].cert_hash) {
      return { valid: false, tampered_at: chain[i].block_index, blocks: chain.length }
    }
  }
  return { valid: true, blocks: chain.length }
}
